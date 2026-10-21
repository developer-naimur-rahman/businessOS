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

  async findManyWithPagination(
    organizationId: string,
    options: {
      skip: number;
      take: number;
      where?: Prisma.SaleWhereInput;
      orderBy?: Prisma.SaleOrderByWithRelationInput;
    }
  ) {
    const where: Prisma.SaleWhereInput = {
      organizationId,
      ...(options.where || {}),
    };

    const [items, total] = await Promise.all([
      this.client.sale.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
        include: {
          lines: { include: { variant: { include: { product: true } } } },
          payments: true,
          customer: true,
          branch: true,
        },
      }),
      this.client.sale.count({ where }),
    ]);

    return { items, total };
  }

  async updateSaleStatusAndFulfillment(
    organizationId: string,
    id: string,
    status: 'DRAFT' | 'COMPLETED' | 'CANCELLED',
    fulfillmentStatus?: 'PENDING_FILES' | 'QUEUED' | 'PROCESSING' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED'
  ) {
    return this.client.sale.update({
      where: { id, organizationId },
      data: {
        status,
        updatedAt: new Date(),
        ...(fulfillmentStatus
          ? {
              lines: {
                updateMany: {
                  where: { saleId: id },
                  data: { fulfillmentStatus },
                },
              },
            }
          : {}),
      },
      include: {
        lines: { include: { variant: { include: { product: true } } } },
        payments: true,
        customer: true,
      },
    });
  }

  async recordAuditLog(data: {
    organizationId: string;
    entityType: string;
    entityId: string;
    action: string;
    oldData?: any;
    newData?: any;
    userId?: string;
    ipAddress?: string;
  }) {
    return this.client.auditLog.create({
      data: {
        organizationId: data.organizationId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        oldData: data.oldData || undefined,
        newData: data.newData || undefined,
        userId: data.userId || null,
        ipAddress: data.ipAddress || null,
      },
    });
  }

  async getAuditLogsForEntity(organizationId: string, entityType: string, entityId: string) {
    return this.client.auditLog.findMany({
      where: {
        organizationId,
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }
}

