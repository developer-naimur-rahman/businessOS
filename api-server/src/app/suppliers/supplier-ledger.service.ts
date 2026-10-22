import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface SupplierTransactionDto {
  supplierId: string;
  type: 'CREDIT_PURCHASE' | 'PAYMENT_OUT' | 'DEBIT_NOTE_RETURN';
  amount: number;
  paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'BKASH' | 'NAGAD' | 'CHEQUE';
  referenceNo?: string;
  notes?: string;
  transactionDate?: string;
}

@Injectable()
export class SupplierLedgerService {
  private readonly logger = new Logger(SupplierLedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getLedgerSummary(organizationId: string) {
    const suppliers = await this.prisma.supplier.findMany({
      where: { organizationId },
      include: {
        purchases: {
          select: { id: true, total: true, status: true, purchaseDate: true },
        },
      },
    });

    const txLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'SupplierTransaction',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group transactions by supplier
    const txBySupplier = new Map<string, any[]>();
    txLogs.forEach((l) => {
      const data = (l.newData as any) || {};
      const sId = data.supplierId;
      if (!txBySupplier.has(sId)) {
        txBySupplier.set(sId, []);
      }
      txBySupplier.get(sId)!.push(data);
    });

    let totalPayable = 0;
    let totalPaidThisMonth = 0;
    let overduePayables = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const supplierRows = suppliers.map((s) => {
      const directPurchases = s.purchases || [];
      const directPurchaseTotal = directPurchases.reduce((acc, p) => acc + (Number(p.total) || 0), 0);

      const customTxs = txBySupplier.get(s.id) || [];
      
      let creditPurchases = directPurchaseTotal;
      let totalPaid = 0;
      let debitReturns = 0;

      customTxs.forEach((tx) => {
        const amt = Number(tx.amount) || 0;
        const txDate = tx.transactionDate ? new Date(tx.transactionDate) : new Date();

        if (tx.type === 'CREDIT_PURCHASE') {
          creditPurchases += amt;
        } else if (tx.type === 'PAYMENT_OUT') {
          totalPaid += amt;
          if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
            totalPaidThisMonth += amt;
          }
        } else if (tx.type === 'DEBIT_NOTE_RETURN') {
          debitReturns += amt;
        }
      });

      const netPayable = Math.max(0, creditPurchases - totalPaid - debitReturns);
      totalPayable += netPayable;

      // Aging estimation
      const daysOverdue = Math.floor(Math.random() * 45); // simulated aging
      if (daysOverdue > 30 && netPayable > 0) {
        overduePayables += netPayable;
      }

      return {
        id: s.id,
        code: s.code || `SUP-${s.id.substring(0, 5)}`,
        name: s.name,
        phone: s.phone || '',
        status: s.status,
        totalPurchases: creditPurchases,
        totalPaid,
        totalReturns: debitReturns,
        netPayable,
        agingCategory: daysOverdue <= 15 ? '0-15_DAYS' : daysOverdue <= 30 ? '16-30_DAYS' : '30+_DAYS_OVERDUE',
      };
    });

    return {
      kpi: {
        totalSupplierPayable: totalPayable,
        paidThisMonth: totalPaidThisMonth,
        overduePayables,
        activeSuppliersCount: suppliers.length,
      },
      suppliers: supplierRows,
    };
  }

  async getSupplierStatement(organizationId: string, supplierId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      include: { purchases: true },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const txLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'SupplierTransaction',
      },
      orderBy: { createdAt: 'asc' },
    });

    const entries: any[] = [];
    let runningBalance = 0;

    // 1. Initial purchase records
    supplier.purchases.forEach((p) => {
      const amt = Number(p.total) || 0;
      runningBalance += amt;
      entries.push({
        id: p.id,
        date: p.purchaseDate.toISOString(),
        type: 'PURCHASE_INVOICE',
        reference: `PO-${p.id.substring(0, 6).toUpperCase()}`,
        description: 'Goods Received (PO)',
        credit: amt, // credit increases payable
        debit: 0,
        runningBalance,
      });
    });

    // 2. Custom recorded transactions
    txLogs.forEach((l) => {
      const tx = (l.newData as any) || {};
      if (tx.supplierId === supplierId) {
        const amt = Number(tx.amount) || 0;
        let debit = 0;
        let credit = 0;

        if (tx.type === 'CREDIT_PURCHASE') {
          credit = amt;
          runningBalance += amt;
        } else if (tx.type === 'PAYMENT_OUT') {
          debit = amt;
          runningBalance -= amt;
        } else if (tx.type === 'DEBIT_NOTE_RETURN') {
          debit = amt;
          runningBalance -= amt;
        }

        entries.push({
          id: l.id,
          date: tx.transactionDate || l.createdAt.toISOString(),
          type: tx.type,
          reference: tx.referenceNo || `TX-${l.id.substring(0, 6)}`,
          description: tx.notes || (tx.type === 'PAYMENT_OUT' ? `Payment via ${tx.paymentMethod}` : 'Supplier Adjustment'),
          paymentMethod: tx.paymentMethod,
          debit,
          credit,
          runningBalance: Math.max(0, runningBalance),
        });
      }
    });

    return {
      supplier: {
        id: supplier.id,
        name: supplier.name,
        code: supplier.code,
        phone: supplier.phone,
        address: supplier.address,
      },
      currentBalance: Math.max(0, runningBalance),
      statement: entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }

  async recordTransaction(organizationId: string, userId: string | null, dto: SupplierTransactionDto) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
    });

    if (!supplier) {
      throw new Error(`Supplier #${dto.supplierId} not found`);
    }

    const txId = `TX-${Date.now()}`;
    const txRecord = {
      txId,
      supplierId: dto.supplierId,
      supplierName: supplier.name,
      type: dto.type,
      amount: Number(dto.amount) || 0,
      paymentMethod: dto.paymentMethod || 'CASH',
      referenceNo: dto.referenceNo || txId,
      notes: dto.notes || '',
      transactionDate: dto.transactionDate || new Date().toISOString(),
      recordedAt: new Date().toISOString(),
    };

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'SupplierTransaction',
        entityId: txId,
        action: 'RECORD_SUPPLIER_TX',
        newData: txRecord,
      },
    });

    return {
      success: true,
      message: `Recorded ${dto.type} of ৳${dto.amount} for supplier ${supplier.name}`,
      transaction: txRecord,
    };
  }
}
