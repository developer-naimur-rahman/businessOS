import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { HybridIntelligenceService } from '../common/services/hybrid-intelligence.service';

export interface RecordBakiDto {
  customerId: string;
  type: 'NEW_BAKI_SALE' | 'DUE_COLLECTION';
  amount: number;
  paymentMethod?: 'CASH' | 'MOBILE_BANKING' | 'BANK';
  saleId?: string;
  invoiceNumber?: string;
  notes?: string;
  dueDate?: string;
}

export interface SendReminderDto {
  customerId: string;
  customerPhone?: string;
  dueAmountBdt?: number;
  paymentBkashNumber?: string;
}

@Injectable()
export class BakiKhataService {
  private readonly logger = new Logger(BakiKhataService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hybridAi: HybridIntelligenceService,
  ) {}

  async getLedgerSummary(organizationId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { organizationId },
      include: {
        sales: {
          select: { id: true, saleNumber: true, total: true, paymentStatus: true, saleDate: true, createdAt: true },
        },
      },
    });

    const bakiLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'BakiTransaction',
      },
      orderBy: { createdAt: 'desc' },
    });

    const logsByCustomer = new Map<string, any[]>();
    bakiLogs.forEach((l) => {
      const data = (l.newData as any) || {};
      const cId = data.customerId;
      if (!logsByCustomer.has(cId)) {
        logsByCustomer.set(cId, []);
      }
      logsByCustomer.get(cId)!.push({ ...data, id: l.id, createdAt: l.createdAt.toISOString() });
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    let totalMarketDueBdt = 0;
    let collectedThisMonthBdt = 0;
    let overdueCustomersCount = 0;

    const customerRows = customers.map((c) => {
      const txs = logsByCustomer.get(c.id) || [];
      
      // Calculate from explicit baki transactions
      let explicitBakiTotal = 0;
      let explicitPaidTotal = 0;
      let lastTxDate = c.createdAt;

      txs.forEach((t) => {
        const amt = Number(t.amount) || 0;
        const txDate = new Date(t.createdAt || t.transactionDate || now);
        if (txDate > lastTxDate) lastTxDate = txDate;

        if (t.type === 'NEW_BAKI_SALE') {
          explicitBakiTotal += amt;
        } else if (t.type === 'DUE_COLLECTION') {
          explicitPaidTotal += amt;
          if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
            collectedThisMonthBdt += amt;
          }
        }
      });

      // Also account for sales with UNPAID or PARTIALLY_PAID
      let unpaidSalesDue = 0;
      c.sales.forEach((s) => {
        if (s.paymentStatus === 'UNPAID') {
          unpaidSalesDue += Number(s.total) || 0;
        } else if (s.paymentStatus === 'PARTIALLY_PAID') {
          unpaidSalesDue += (Number(s.total) || 0) * 0.5; // Estimated 50% remaining if partially paid
        }
      });

      const netDueBdt = Math.max(0, explicitBakiTotal + unpaidSalesDue - explicitPaidTotal);
      totalMarketDueBdt += netDueBdt;

      const isOverdue = netDueBdt > 0 && lastTxDate < thirtyDaysAgo;
      if (isOverdue) overdueCustomersCount++;

      let riskLevel: 'NORMAL' | 'WARNING' | 'HIGH_RISK' = 'NORMAL';
      if (isOverdue || netDueBdt >= 10000) {
        riskLevel = 'HIGH_RISK';
      } else if (netDueBdt >= 3000) {
        riskLevel = 'WARNING';
      }

      return {
        customerId: c.id,
        name: c.name,
        phone: c.phone || 'N/A',
        address: c.address || 'Local Customer',
        totalCreditBdt: explicitBakiTotal + unpaidSalesDue,
        totalPaidBdt: explicitPaidTotal,
        netDueBdt,
        lastTransactionDate: lastTxDate.toISOString(),
        transactionCount: txs.length + c.sales.length,
        riskLevel,
        isOverdue,
      };
    });

    // Sort by highest due first
    customerRows.sort((a, b) => b.netDueBdt - a.netDueBdt);

    return {
      totalMarketDueBdt,
      collectedThisMonthBdt,
      overdueCustomersCount,
      totalCustomersWithDue: customerRows.filter((c) => c.netDueBdt > 0).length,
      customers: customerRows,
    };
  }

  async getCustomerStatement(organizationId: string, customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { organizationId_id: { organizationId, id: customerId } },
      include: {
        sales: {
          select: { id: true, saleNumber: true, total: true, paymentStatus: true, saleDate: true, createdAt: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const bakiLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'BakiTransaction',
      },
      orderBy: { createdAt: 'asc' },
    });

    const transactions = [];
    let runningBalance = 0;

    // Direct sales as baki sales if unpaid
    customer.sales.forEach((s) => {
      if (s.paymentStatus !== 'PAID') {
        const amt = Number(s.total) || 0;
        runningBalance += amt;
        transactions.push({
          id: s.id,
          date: s.saleDate.toISOString(),
          type: 'SALE_INVOICE',
          referenceNo: s.saleNumber || s.id.substring(0, 8),
          debit: amt,
          credit: 0,
          balance: runningBalance,
          notes: `POS/Store Sale (${s.paymentStatus})`,
        });
      }
    });

    // Explicit baki transactions
    bakiLogs.forEach((l) => {
      const data = (l.newData as any) || {};
      if (data.customerId === customerId) {
        const amt = Number(data.amount) || 0;
        if (data.type === 'NEW_BAKI_SALE') {
          runningBalance += amt;
          transactions.push({
            id: l.id,
            date: l.createdAt.toISOString(),
            type: 'NEW_BAKI_SALE',
            referenceNo: data.invoiceNumber || `BAKI-${l.id.substring(0, 6)}`,
            debit: amt,
            credit: 0,
            balance: runningBalance,
            notes: data.notes || 'বাকিতে ক্রয়',
          });
        } else if (data.type === 'DUE_COLLECTION') {
          runningBalance = Math.max(0, runningBalance - amt);
          transactions.push({
            id: l.id,
            date: l.createdAt.toISOString(),
            type: 'DUE_COLLECTION',
            referenceNo: `REC-${l.id.substring(0, 6)}`,
            debit: 0,
            credit: amt,
            balance: runningBalance,
            notes: `বকেয়া আদায় (${data.paymentMethod || 'CASH'}) - ${data.notes || ''}`,
          });
        }
      }
    });

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
      },
      netDueBdt: runningBalance,
      transactions,
    };
  }

  async recordTransaction(organizationId: string, userId: string | null, dto: RecordBakiDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { organizationId_id: { organizationId, id: dto.customerId } },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const txRecord = {
      customerId: dto.customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      type: dto.type,
      amount: Number(dto.amount) || 0,
      paymentMethod: dto.paymentMethod || 'CASH',
      saleId: dto.saleId || null,
      invoiceNumber: dto.invoiceNumber || null,
      notes: dto.notes || '',
      dueDate: dto.dueDate || null,
      transactionDate: new Date().toISOString(),
    };

    const log = await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'BakiTransaction',
        entityId: `${dto.customerId}-${Date.now()}`,
        action: dto.type,
        newData: txRecord,
      },
    });

    return {
      success: true,
      transactionId: log.id,
      message: dto.type === 'NEW_BAKI_SALE' ? 'বকেয়া সফলভাবে যোগ করা হয়েছে' : 'বকেয়া টাকা সফলভাবে আদায় হিসেবে রেকর্ড হয়েছে',
      record: txRecord,
    };
  }

  async sendReminder(organizationId: string, userId: string | null, dto: SendReminderDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { organizationId_id: { organizationId, id: dto.customerId } },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const phone = dto.customerPhone || customer.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const dueAmount = dto.dueAmountBdt || 0;
    const bkashNo = dto.paymentBkashNumber || '01700000000';

    // Bangla Taqada Message
    const banglaMessage = `সম্মানিত ${customer.name}, আসসালামু আলাইকুম। আমাদের শপে আপনার মোট বকেয়া ৳${dueAmount.toLocaleString()} টাকা। অনুগ্রহ করে আমাদের বিকাশ/নগদ মার্চেন্ট নাম্বার ${bkashNo} এ পাঠিয়ে কনফার্ম করুন। ধন্যবাদ।`;

    const whatsappUrl = `https://wa.me/88${cleanPhone.startsWith('88') ? cleanPhone.slice(2) : cleanPhone}?text=${encodeURIComponent(banglaMessage)}`;

    // Log reminder in AuditLog
    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'BakiReminderTaqada',
        entityId: `${dto.customerId}-${Date.now()}`,
        action: 'SEND_REMINDER',
        newData: {
          customerId: dto.customerId,
          phone,
          dueAmount,
          message: banglaMessage,
          channel: 'WHATSAPP_SMS',
          dispatchedAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: banglaMessage,
      whatsappUrl,
      customerPhone: phone,
      dueAmountBdt: dueAmount,
    };
  }
}
