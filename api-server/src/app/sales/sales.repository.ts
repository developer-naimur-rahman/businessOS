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

  async createSale(data: Prisma.SaleUncheckedCreateInput): Promise<Sale> {
    return this.client.sale.create({ data, include: { lines: true, payments: true } });
  }

  async findById(organizationId: string, id: string): Promise<Sale | null> {
    return this.client.sale.findUnique({
      where: { id, organizationId },
      include: { lines: true, payments: true },
    });
  }

  async findByIdempotencyKey(organizationId: string, idempotencyKey: string): Promise<Sale | null> {
    return this.client.sale.findUnique({
      where: { organizationId_idempotencyKey: { organizationId, idempotencyKey } },
      include: { lines: true, payments: true },
    });
  }

  async updateStatus(organizationId: string, id: string, status: 'COMPLETED' | 'CANCELLED', saleNumber?: string): Promise<Sale> {
    return this.client.sale.update({
      where: { id, organizationId },
      data: { status, saleNumber, updatedAt: new Date() },
      include: { lines: true, payments: true },
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
