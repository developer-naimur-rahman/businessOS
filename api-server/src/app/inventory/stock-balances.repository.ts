import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClientManager } from '../common/prisma/prisma-client.manager';
import { StockBalance, Prisma } from '@prisma/client';

@Injectable()
export class StockBalancesRepository {
  constructor(private readonly prismaManager: PrismaClientManager) {}

  private get client() {
    return this.prismaManager.client;
  }

  async findByProductAndWarehouse(organizationId: string, warehouseId: string, productId: string): Promise<StockBalance | null> {
    return this.client.stockBalance.findUnique({
      where: {
        organizationId_warehouseId_productId: {
          organizationId,
          warehouseId,
          productId,
        },
      },
    });
  }

  async findManyByOrganization(organizationId: string, params: { warehouseId?: string; productId?: string; skip?: number; take?: number } = {}): Promise<StockBalance[]> {
    return this.client.stockBalance.findMany({
      where: {
        organizationId,
        ...(params.warehouseId && { warehouseId: params.warehouseId }),
        ...(params.productId && { productId: params.productId }),
      },
      skip: params.skip,
      take: params.take,
    });
  }

  async upsertStock(organizationId: string, warehouseId: string, productId: string, quantity: Prisma.Decimal | number) {
    return this.client.stockBalance.upsert({
      where: {
        organizationId_warehouseId_productId: {
          organizationId,
          warehouseId,
          productId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        organizationId,
        warehouseId,
        productId,
        quantity,
      },
    });
  }

  async decrementStock(organizationId: string, warehouseId: string, productId: string, quantity: Prisma.Decimal | number) {
    const res = await this.client.stockBalance.updateMany({
      where: {
        organizationId,
        warehouseId,
        productId,
        quantity: { gte: quantity },
      },
      data: {
        quantity: { decrement: quantity },
      },
    });
    if (res.count === 0) {
      throw new BadRequestException('Insufficient stock or stock record not found.');
    }
  }
}


