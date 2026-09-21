import { Injectable } from '@nestjs/common';
import { PrismaClientManager, IUnitOfWork } from '../common/prisma/prisma-client.manager';
import { Prisma, Sale } from '@prisma/client';

@Injectable()
export class SalesRepository {
  constructor(
    private readonly prismaManager: PrismaClientManager,
    private readonly uow: IUnitOfWork,
  ) {}

  private get client() {
    return this.prismaManager.client;
  }

  async runTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.uow.run(work);
  }

  async createSale(data: Prisma.SaleUncheckedCreateInput) {
    return this.client.sale.create({ 
      data, 
      include: { 
        lines: { include: { variant: { include: { product: true } } } }, 
        payments: true,
        customer: true 
      } 
    });
  }

  async findById(organizationId: string, id: string) {
    return this.client.sale.findUnique({
      where: { id, organizationId },
      include: { 
        lines: { include: { variant: { include: { product: true } } } }, 
        payments: true,
        customer: true
      },
    });
  }

  async findByIdempotencyKey(organizationId: string, idempotencyKey: string) {
    return this.client.sale.findUnique({
      where: { organizationId_idempotencyKey: { organizationId, idempotencyKey } },
      include: { 
        lines: { include: { variant: { include: { product: true } } } }, 
        payments: true,
        customer: true 
      },
    });
  }

  async updateStatus(organizationId: string, id: string, status: 'COMPLETED' | 'CANCELLED', saleNumber?: string) {
    return this.client.sale.update({
      where: { id, organizationId },
      data: { status, saleNumber, updatedAt: new Date() },
      include: { lines: true, payments: true },
    });
  }

  async updatePaymentStatus(organizationId: string, id: string, paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID') {
    return this.client.sale.update({
      where: { id, organizationId },
      data: { paymentStatus, updatedAt: new Date() },
      include: { lines: true, payments: true },
    });
  }

  async addPayment(organizationId: string, data: Prisma.SalePaymentCreateInput) {
    return this.client.salePayment.create({
      data,
    });
  }

  async findPaymentByIdempotencyKey(organizationId: string, idempotencyKey: string) {
    if (!idempotencyKey) return null;
    return this.client.salePayment.findUnique({
      where: { organizationId_idempotencyKey: { organizationId, idempotencyKey } },
    });
  }

  async generateSaleNumber(organizationId: string): Promise<string> {
    const prefix = 'SALE';
    const year = new Date().getFullYear();

    const sequence = await this.client.documentSequence.upsert({
      where: {
        organizationId_prefix_year: {
          organizationId,
          prefix,
          year,
        },
      },
      update: {
        nextSequence: { increment: 1 },
      },
      create: {
        organizationId,
        prefix,
        year,
        nextSequence: 2, // 1 is consumed here
      },
    });

    const currentNumber = sequence.nextSequence - 1;
    return `${prefix}-${year}-${currentNumber.toString().padStart(6, '0')}`;
  }
}
