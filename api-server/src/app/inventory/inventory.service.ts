import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryMovementsRepository } from './inventory-movements.repository';
import { StockBalancesRepository } from './stock-balances.repository';
import { ProductsService } from '../business-core/services/products.service';
import { VariantsService } from '../business-core/services/variants.service';
import { WarehousesService } from '../operational-structure/warehouses/warehouses.service';
import { Prisma, MovementType } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(
    private readonly movementsRepo: InventoryMovementsRepository,
    private readonly balancesRepo: StockBalancesRepository,
    private readonly productsService: ProductsService,
    private readonly variantsService: VariantsService,
    private readonly warehousesService: WarehousesService,
  ) {}

  async getBalances(organizationId: string, warehouseId?: string, variantId?: string, productId?: string) {
    return this.balancesRepo.findManyByOrganization(organizationId, { warehouseId, variantId, productId });
  }

  async getMovements(organizationId: string, warehouseId?: string, variantId?: string) {
    return this.movementsRepo.findManyByOrganization(organizationId, { warehouseId, variantId });
  }

  private async validateDependencies(organizationId: string, warehouseId: string, variantId: string) {
    const warehouse = await this.warehousesService.findOne(organizationId, warehouseId);
    if (!warehouse.isActive) {
      throw new BadRequestException(`Warehouse ${warehouseId} is inactive.`);
    }

    const variant = await this.variantsService.findOne(organizationId, variantId);
    const product = await this.productsService.findOne(organizationId, variant.productId);
    if (product.type === 'SERVICE') {
      throw new BadRequestException(`Product ${variantId} is a SERVICE and cannot have physical stock.`);
    }
    if (!product.isActive) {
      throw new BadRequestException(`Product ${variantId} is inactive.`);
    }
  }

  async createAdjustment(
    organizationId: string,
    data: {
      warehouseId: string;
      variantId: string;
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

    await this.validateDependencies(organizationId, data.warehouseId, data.variantId);

    return this.movementsRepo.runTransaction(async () => {
      // 1. Update Balance
      if (data.type === 'ADJUSTMENT_IN') {
        await this.balancesRepo.upsertStock(organizationId, data.warehouseId, data.variantId, data.quantity);
      } else {
        await this.balancesRepo.decrementStock(organizationId, data.warehouseId, data.variantId, data.quantity);
      }

      // 2. Create Movement
      return this.movementsRepo.createMovement({
        data: {
          organizationId,
          warehouseId: data.warehouseId,
          variantId: data.variantId, // FIXME: API needs to be updated to accept variantId instead of variantId, but for now we map it. Wait, the DTO probably still says variantId. Let's map it.
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
      variantId: string;
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

    await this.validateDependencies(organizationId, data.sourceWarehouseId, data.variantId);
    await this.validateDependencies(organizationId, data.destinationWarehouseId, data.variantId);

    return this.movementsRepo.runTransaction(async () => {
      // Outbound from Source
      await this.balancesRepo.decrementStock(organizationId, data.sourceWarehouseId, data.variantId, data.quantity);

      // Inbound to Destination
      await this.balancesRepo.upsertStock(organizationId, data.destinationWarehouseId, data.variantId, data.quantity);

      const sourceMovement = await this.movementsRepo.createMovement({
        data: {
          organizationId,
          warehouseId: data.sourceWarehouseId,
          variantId: data.variantId,
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
          variantId: data.variantId,
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

  async createReceipt(
    organizationId: string,
    warehouseId: string,
    items: Array<{ variantId: string; quantity: Prisma.Decimal | number; unitCost: Prisma.Decimal | number }>,
    referenceId: string,
    userId: string,
    idempotencyKeyPrefix?: string,
  ) {
    // We assume we are in the Purchase UoW transaction via PRISMA_TX_ALS automatically.
    const movements = [];
    
    for (const item of items) {
      const quantity = new Prisma.Decimal(item.quantity);
      const unitCost = new Prisma.Decimal(item.unitCost);
      
      const variant = await this.variantsService.findOne(organizationId, item.variantId);
      
      // Calculate WAC
      const currentBalance = await this.balancesRepo.getStockBalance(organizationId, warehouseId, item.variantId);
      const currentQty = currentBalance ? currentBalance.quantity : new Prisma.Decimal(0);
      const oldQty = currentQty.greaterThanOrEqualTo(0) ? currentQty : new Prisma.Decimal(0);
      const oldWac = variant.costPrice ? new Prisma.Decimal(variant.costPrice) : new Prisma.Decimal(0);
      
      const totalOldValue = oldQty.times(oldWac);
      const totalNewValue = quantity.times(unitCost);
      const newTotalQty = oldQty.plus(quantity);
      
      let newWac = unitCost;
      if (newTotalQty.greaterThan(0)) {
        newWac = totalOldValue.plus(totalNewValue).dividedBy(newTotalQty).toDecimalPlaces(4);
      }

      // Update variant costPrice (WAC)
      await this.variantsService.update(organizationId, item.variantId, {
        costPrice: newWac,
      });

      // Update StockBalance
      await this.balancesRepo.upsertStock(organizationId, warehouseId, item.variantId, quantity);
      
      // Create movement
      const movement = await this.movementsRepo.createMovement({
        data: {
          organizationId,
          warehouseId,
          variantId: item.variantId,
          type: MovementType.RECEIPT,
          quantity: quantity,
          unitCost: unitCost,
          referenceType: 'PURCHASE',
          referenceId: referenceId,
          idempotencyKey: idempotencyKeyPrefix ? `${idempotencyKeyPrefix}-${item.variantId}` : undefined,
          createdByUserId: userId,
        },
      });
      movements.push(movement);
    }
    return movements;
  }

  async deductStockForSale(
    organizationId: string,
    warehouseId: string,
    items: Array<{ variantId: string; quantity: Prisma.Decimal | number }>,
    saleId: string,
    userId: string,
  ) {
    // We do NOT use runTransaction here because we assume we are already in the Sales module's transaction (UoW).
    // The underlying repositories will use the active UoW transaction via PRISMA_TX_ALS automatically.
    
    const movements = [];
    for (const item of items) {
      await this.balancesRepo.decrementStock(organizationId, warehouseId, item.variantId, item.quantity);
      
      const movement = await this.movementsRepo.createMovement({
        data: {
          organizationId,
          warehouseId,
          variantId: item.variantId,
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

