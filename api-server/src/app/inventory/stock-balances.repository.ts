import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClientManager } from '../common/prisma/prisma-client.manager';
import { StockBalance, Prisma } from '@prisma/client';

@Injectable()
export class StockBalancesRepository {
  constructor(private readonly prismaManager: PrismaClientManager) {}

  private get client() {
    return this.prismaManager.client;
  }

  async getStockBalance(organizationId: string, warehouseId: string, variantId: string): Promise<StockBalance | null> {
    return this.client.stockBalance.findUnique({
      where: {
        organizationId_warehouseId_variantId: {
          organizationId,
          warehouseId,
          variantId: variantId,
        },
      },
    });
  }

  async findManyByOrganization(organizationId: string, params: { warehouseId?: string; variantId?: string; productId?: string; skip?: number; take?: number } = {}): Promise<StockBalance[]> {
    return this.client.stockBalance.findMany({
      where: {
        organizationId,
        ...(params.warehouseId && { warehouseId: params.warehouseId }),
        ...(params.variantId && { variantId: params.variantId }),
        ...(params.productId && { variant: { productId: params.productId } }),
      },
      include: {
        warehouse: true // Include warehouse details for the frontend
      },
      skip: params.skip,
      take: params.take,
    });
  }

  async upsertStock(organizationId: string, warehouseId: string, variantId: string, quantity: Prisma.Decimal | number) {
    return this.client.stockBalance.upsert({
      where: {
        organizationId_warehouseId_variantId: {
          organizationId,
          warehouseId,
          variantId: variantId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        organizationId,
        warehouseId,
        variantId: variantId,
        quantity,
      },
    });
  }

  async decrementStock(organizationId: string, warehouseId: string, variantId: string, quantity: Prisma.Decimal | number) {
    const res = await this.client.stockBalance.updateMany({
      where: {
        organizationId,
        warehouseId,
        variantId: variantId,
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


