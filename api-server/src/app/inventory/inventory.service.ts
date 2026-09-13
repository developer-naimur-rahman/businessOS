import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryMovementsRepository } from './inventory-movements.repository';
import { StockBalancesRepository } from './stock-balances.repository';
import { ProductsService } from '../business-core/services/products.service';
import { WarehousesService } from '../operational-structure/warehouses/warehouses.service';
import { Prisma, MovementType } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(
    private readonly movementsRepo: InventoryMovementsRepository,
    private readonly balancesRepo: StockBalancesRepository,
    private readonly productsService: ProductsService,
    private readonly warehousesService: WarehousesService,
  ) {}

  async getBalances(organizationId: string, warehouseId?: string, productId?: string) {
    return this.balancesRepo.findManyByOrganization(organizationId, { warehouseId, productId });
  }

  async getMovements(organizationId: string, warehouseId?: string, productId?: string) {
    return this.movementsRepo.findManyByOrganization(organizationId, { warehouseId, productId });
  }

  private async validateDependencies(organizationId: string, warehouseId: string, productId: string) {
    const warehouse = await this.warehousesService.findOne(organizationId, warehouseId);
    if (!warehouse.isActive) {
      throw new BadRequestException(`Warehouse ${warehouseId} is inactive.`);
    }

    const product = await this.productsService.findOne(organizationId, productId);
    if (product.type === 'SERVICE') {
      throw new BadRequestException(`Product ${productId} is a SERVICE and cannot have physical stock.`);
    }
    if (!product.isActive) {
      throw new BadRequestException(`Product ${productId} is inactive.`);
    }
  }

  async createAdjustment(
    organizationId: string,
    data: {
      warehouseId: string;
      productId: string;
      quantity: Prisma.Decimal | number;
      type: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT';
      referenceType?: string;
      referenceId?: string;
      notes?: string;
      idempotencyKey?: string;
    },
    userId: string,
  ) {
    if (data.idempotencyKey) {
      const existing = await this.movementsRepo.findByIdempotencyKey(organizationId, data.idempotencyKey);
      if (existing) return existing;
    }

    if (Number(data.quantity) <= 0) {
      throw new BadRequestException('Quantity must be greater than zero.');
    }

    await this.validateDependencies(organizationId, data.warehouseId, data.productId);

    return this.movementsRepo.runTransaction(async () => {
      // 1. Update Balance
      if (data.type === 'ADJUSTMENT_IN') {
        await this.balancesRepo.upsertStock(organizationId, data.warehouseId, data.productId, data.quantity);
      } else {
        await this.balancesRepo.decrementStock(organizationId, data.warehouseId, data.productId, data.quantity);
      }

      // 2. Create Movement
      return this.movementsRepo.createMovement({
        data: {
          organizationId,
          warehouseId: data.warehouseId,
          productId: data.productId,
          type: data.type,
          quantity: data.quantity,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          idempotencyKey: data.idempotencyKey,
          notes: data.notes,
          createdByUserId: userId,
        },
      });
    });
  }

  async createTransfer(
    organizationId: string,
    data: {
      sourceWarehouseId: string;
      destinationWarehouseId: string;
      productId: string;
      quantity: Prisma.Decimal | number;
      referenceType?: string;
      referenceId?: string;
      notes?: string;
      idempotencyKey?: string;
    },
    userId: string,
  ) {
    if (data.sourceWarehouseId === data.destinationWarehouseId) {
      throw new BadRequestException('Source and destination warehouses must be different.');
    }

    if (Number(data.quantity) <= 0) {
      throw new BadRequestException('Quantity must be greater than zero.');
    }

    if (data.idempotencyKey) {
      const existingOut = await this.movementsRepo.findByIdempotencyKey(organizationId, `${data.idempotencyKey}-OUT`);
      if (existingOut) {
        const existingIn = await this.movementsRepo.findByIdempotencyKey(organizationId, `${data.idempotencyKey}-IN`);
        return { sourceMovement: existingOut, destinationMovement: existingIn };
      }
    }

    await this.validateDependencies(organizationId, data.sourceWarehouseId, data.productId);
    await this.validateDependencies(organizationId, data.destinationWarehouseId, data.productId);

    return this.movementsRepo.runTransaction(async () => {
      // Outbound from Source
      await this.balancesRepo.decrementStock(organizationId, data.sourceWarehouseId, data.productId, data.quantity);

      // Inbound to Destination
      await this.balancesRepo.upsertStock(organizationId, data.destinationWarehouseId, data.productId, data.quantity);

      const sourceMovement = await this.movementsRepo.createMovement({
        data: {
          organizationId,
          warehouseId: data.sourceWarehouseId,
          productId: data.productId,
          type: MovementType.TRANSFER_OUT,
          quantity: data.quantity,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          idempotencyKey: data.idempotencyKey ? `${data.idempotencyKey}-OUT` : undefined,
          notes: data.notes,
          createdByUserId: userId,
        },
      });

      const destinationMovement = await this.movementsRepo.createMovement({
        data: {
          organizationId,
          warehouseId: data.destinationWarehouseId,
          productId: data.productId,
          type: MovementType.TRANSFER_IN,
          quantity: data.quantity,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          idempotencyKey: data.idempotencyKey ? `${data.idempotencyKey}-IN` : undefined,
          notes: data.notes,
          createdByUserId: userId,
        },
      });

      return { sourceMovement, destinationMovement };
    });
  }

  async deductStockForSale(
    organizationId: string,
    warehouseId: string,
    items: Array<{ productId: string; quantity: Prisma.Decimal | number }>,
    saleId: string,
    userId: string,
  ) {
    // We do NOT use runTransaction here because we assume we are already in the Sales module's transaction (UoW).
    // The underlying repositories will use the active UoW transaction via PRISMA_TX_ALS automatically.
    
    const movements = [];
    for (const item of items) {
      await this.balancesRepo.decrementStock(organizationId, warehouseId, item.productId, item.quantity);
      
      const movement = await this.movementsRepo.createMovement({
        data: {
          organizationId,
          warehouseId,
          productId: item.productId,
          type: MovementType.ISSUE,
          quantity: item.quantity,
          referenceType: 'SALE',
          referenceId: saleId,
          createdByUserId: userId,
        },
      });
      movements.push(movement);
    }
    return movements;
  }
}

