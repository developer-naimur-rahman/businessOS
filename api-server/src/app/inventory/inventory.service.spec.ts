import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { InventoryMovementsRepository } from './inventory-movements.repository';
import { StockBalancesRepository } from './stock-balances.repository';
import { ProductsService } from '../business-core/services/products.service';
import { WarehousesService } from '../operational-structure/warehouses/warehouses.service';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('InventoryService', () => {
  let service: InventoryService;
  let movementsRepo: jest.Mocked<InventoryMovementsRepository>;
  let balancesRepo: jest.Mocked<StockBalancesRepository>;
  let productsService: jest.Mocked<ProductsService>;
  let warehousesService: jest.Mocked<WarehousesService>;

  beforeEach(async () => {
    movementsRepo = {
      findByIdAndOrganization: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      findManyByOrganization: jest.fn(),
      runTransaction: jest.fn((cb) => cb({
        stockBalance: { upsert: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        inventoryMovement: { create: jest.fn() }
      } as any)),
    } as any;

    balancesRepo = {
      findByProductAndWarehouse: jest.fn(),
      findManyByOrganization: jest.fn(),
    } as any;

    productsService = {
      findOne: jest.fn().mockResolvedValue({ isActive: true, type: 'PRODUCT' }),
    } as any;

    warehousesService = {
      findOne: jest.fn().mockResolvedValue({ isActive: true }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: InventoryMovementsRepository, useValue: movementsRepo },
        { provide: StockBalancesRepository, useValue: balancesRepo },
        { provide: ProductsService, useValue: productsService },
        { provide: WarehousesService, useValue: warehousesService },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  describe('createAdjustment', () => {
    it('should throw if product is a SERVICE', async () => {
      productsService.findOne.mockResolvedValue({ isActive: true, type: 'SERVICE' } as any);
      await expect(service.createAdjustment('org-1', { warehouseId: 'w-1', productId: 'p-1', quantity: 10, type: 'ADJUSTMENT_IN' }, 'u-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw if warehouse is inactive', async () => {
      warehousesService.findOne.mockResolvedValue({ isActive: false } as any);
      await expect(service.createAdjustment('org-1', { warehouseId: 'w-1', productId: 'p-1', quantity: 10, type: 'ADJUSTMENT_IN' }, 'u-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should return existing movement on idempotent retry', async () => {
      const existing = { id: 'mov-1' };
      movementsRepo.findByIdempotencyKey.mockResolvedValue(existing as any);
      const res = await service.createAdjustment('org-1', { warehouseId: 'w-1', productId: 'p-1', quantity: 10, type: 'ADJUSTMENT_IN', idempotencyKey: 'abc' }, 'u-1');
      expect(res).toEqual(existing);
      expect(productsService.findOne).not.toHaveBeenCalled(); // Validations skipped
    });

    it('should throw if quantity is <= 0', async () => {
      await expect(service.createAdjustment('org-1', { warehouseId: 'w-1', productId: 'p-1', quantity: 0, type: 'ADJUSTMENT_IN' }, 'u-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('createTransfer', () => {
    it('should throw if source and dest warehouse are the same', async () => {
      await expect(service.createTransfer('org-1', { sourceWarehouseId: 'w-1', destinationWarehouseId: 'w-1', productId: 'p-1', quantity: 10 }, 'u-1'))
        .rejects.toThrow(BadRequestException);
    });
    
    it('should return existing movements on idempotent retry', async () => {
      movementsRepo.findByIdempotencyKey
        .mockResolvedValueOnce({ id: 'mov-out' } as any)
        .mockResolvedValueOnce({ id: 'mov-in' } as any);
        
      const res = await service.createTransfer('org-1', { sourceWarehouseId: 'w-1', destinationWarehouseId: 'w-2', productId: 'p-1', quantity: 10, idempotencyKey: 'tx1' }, 'u-1');
      expect(res).toEqual({ sourceMovement: { id: 'mov-out' }, destinationMovement: { id: 'mov-in' } });
    });
  });
});
