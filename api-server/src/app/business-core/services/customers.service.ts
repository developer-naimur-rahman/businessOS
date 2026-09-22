import { Injectable } from '@nestjs/common';
import { CustomersRepository } from '../repositories/customers.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async create(organizationId: string, data: Omit<Prisma.CustomerCreateInput, 'organization'>) {
    return this.customersRepository.create(organizationId, data);
  }

  async findAll(organizationId: string) {
    const customers = await this.customersRepository.findAll(organizationId);
    
    // Dynamically calculate due for each customer using the exact same rule as getLedger
    const customerIds = customers.map(c => c.id);
    
    if (customerIds.length === 0) return customers;

    const data = await this.customersRepository['prisma'].sale.findMany({
      where: {
        organizationId,
        customerId: { in: customerIds },
        status: 'COMPLETED',
      },
      select: {
        id: true,
        customerId: true,
        total: true,
        saleDate: true,
        payments: {
          select: {
            amount: true
          }
        }
      }
    });

    const dueMap = new Map<string, number>();
    const totalSpentMap = new Map<string, number>();
    const orderCountMap = new Map<string, number>();
    const lastActivityMap = new Map<string, Date>();

    data.forEach(sale => {
      const saleTotal = Number(sale.total) || 0;
      const salePaid = sale.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      
      const currentDue = dueMap.get(sale.customerId!) || 0;
      const currentSpent = totalSpentMap.get(sale.customerId!) || 0;
      
      // Calculate due exactly as getLedger does (totalSales - totalPaid)
      dueMap.set(sale.customerId!, currentDue + (saleTotal - salePaid));
      totalSpentMap.set(sale.customerId!, currentSpent + saleTotal);
      orderCountMap.set(sale.customerId!, (orderCountMap.get(sale.customerId!) || 0) + 1);
      
      const lastActivity = lastActivityMap.get(sale.customerId!);
      if (!lastActivity || new Date(sale.saleDate) > lastActivity) {
        lastActivityMap.set(sale.customerId!, new Date(sale.saleDate));
      }
    });

    return customers.map(c => ({
      ...c,
      outstandingBalance: Math.max(0, dueMap.get(c.id) || 0),
      totalSpent: totalSpentMap.get(c.id) || 0,
      totalOrders: orderCountMap.get(c.id) || 0,
      lastActivity: lastActivityMap.get(c.id) || c.updatedAt
    }));
  }

  async findOne(organizationId: string, id: string) {
    return this.customersRepository.findByIdAndOrganization(organizationId, id);
  }

  async update(organizationId: string, id: string, data: Prisma.CustomerUpdateInput) {
    return this.customersRepository.update(organizationId, id, data);
  }

  async getLedger(organizationId: string, id: string) {
    // Ensure customer exists and belongs to org
    await this.customersRepository.findByIdAndOrganization(organizationId, id);

    const data = await this.customersRepository.getLedger(organizationId, id);

    const ledgerEntries = [];
    let totalSales = 0;
    let totalPaid = 0;

    for (const sale of data.sales) {
      const amount = Number(sale.total);
      totalSales += amount;
      ledgerEntries.push({
        date: sale.saleDate,
        type: 'SALE',
        saleId: sale.id,
        reference: sale.saleNumber || 'Sale',
        debit: amount,
        credit: 0,
      });
    }

    for (const payment of data.payments) {
      const amount = Number(payment.amount);
      totalPaid += amount;
      ledgerEntries.push({
        date: payment.paymentDate,
        type: 'PAYMENT',
        saleId: payment.saleId,
        paymentId: payment.id,
        reference: payment.reference || payment.method,
        debit: 0,
        credit: amount,
      });
    }

    // Sort chronologically (oldest first). If same date, SALES before PAYMENTS
    ledgerEntries.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      if (a.type === 'SALE' && b.type === 'PAYMENT') return -1;
      if (a.type === 'PAYMENT' && b.type === 'SALE') return 1;
      return 0;
    });

    let runningBalance = 0;
    for (const entry of ledgerEntries) {
      runningBalance += entry.debit - entry.credit;
      entry.runningBalance = runningBalance;
    }

    // Outstanding cannot be negative per rules
    const outstanding = Math.max(0, totalSales - totalPaid);

    return {
      entries: ledgerEntries.reverse(), // Newest first for UI display
      summary: {
        totalSales,
        totalPaid,
        outstanding,
      }
    };
  }
}
