import { Injectable } from '@nestjs/common';
import { PrismaClientManager, IUnitOfWork } from '../../common/prisma/prisma-client.manager';
import { PurchaseStatus, Prisma } from '@prisma/client';

@Injectable()
export class PurchasesRepository {
  constructor(
    private readonly prismaManager: PrismaClientManager,
    private readonly uow: IUnitOfWork,
  ) {}

  async findMany(organizationId: string, params: {
    supplierId?: string;
    warehouseId?: string;
    branchId?: string;
    status?: PurchaseStatus;
    skip?: number;
    take?: number;
  } = {}) {
    return this.prismaManager.client.purchase.findMany({
      where: {
        organizationId,
        ...(params.supplierId && { supplierId: params.supplierId }),
        ...(params.warehouseId && { warehouseId: params.warehouseId }),
        ...(params.branchId && { branchId: params.branchId }),
        ...(params.status && { status: params.status }),
      },
      include: {
        supplier: true,
        warehouse: true,
        branch: true,
      },
      skip: params.skip,
      take: params.take,
      orderBy: { purchaseDate: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    return this.prismaManager.client.purchase.findFirst({
      where: { organizationId, id }
    });
  }
  
  async findOneWithDetails(organizationId: string, id: string) {
    return this.prismaManager.client.purchase.findFirst({
      where: { organizationId, id },
      include: {
        supplier: true,
        warehouse: true,
        branch: true,
        lines: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        },
        payments: true,
      },
    });
  }

  async create(organizationId: string, data: Prisma.PurchaseCreateInput) {
    return this.prismaManager.client.purchase.create({ data });
  }

  async update(organizationId: string, id: string, data: Prisma.PurchaseUpdateInput) {
    return this.prismaManager.client.purchase.update({
      where: { id, organizationId },
      data,
    });
  }

  async delete(organizationId: string, id: string) {
    return this.prismaManager.client.purchase.delete({
      where: { id, organizationId },
    });
  }
  
  async addPayment(organizationId: string, data: Prisma.PurchasePaymentCreateInput) {
    return this.prismaManager.client.purchasePayment.create({ data });
  }

  async runTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.uow.run(work);
  }
}
