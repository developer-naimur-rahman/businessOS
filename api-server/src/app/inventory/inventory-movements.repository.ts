import { Injectable } from '@nestjs/common';
import { PrismaClientManager, IUnitOfWork } from '../common/prisma/prisma-client.manager';
import { Prisma, InventoryMovement } from '@prisma/client';

@Injectable()
export class InventoryMovementsRepository {
  constructor(
    private readonly prismaManager: PrismaClientManager,
    private readonly uow: IUnitOfWork
  ) {}

  private get client() {
    return this.prismaManager.client;
  }

  async findByIdAndOrganization(organizationId: string, id: string): Promise<InventoryMovement | null> {
    return this.client.inventoryMovement.findUnique({
      where: {
        id,
        organizationId,
      },
    });
  }

  async findByIdempotencyKey(organizationId: string, idempotencyKey: string): Promise<InventoryMovement | null> {
    return this.client.inventoryMovement.findUnique({
      where: {
        organizationId_idempotencyKey: {
          organizationId,
          idempotencyKey,
        },
      },
    });
  }
  
  async findManyByOrganization(organizationId: string, params: { warehouseId?: string; productId?: string; skip?: number; take?: number } = {}): Promise<InventoryMovement[]> {
    return this.client.inventoryMovement.findMany({
      where: {
        organizationId,
        ...(params.warehouseId && { warehouseId: params.warehouseId }),
        ...(params.productId && { productId: params.productId }),
      },
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Transactions are orchestrated at the service layer via IUnitOfWork
  runTransaction<T>(fn: (tx?: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.uow.run(() => fn(this.client as Prisma.TransactionClient));
  }

  async createMovement(args: Prisma.InventoryMovementCreateArgs) {
    return this.client.inventoryMovement.create(args);
  }
}

