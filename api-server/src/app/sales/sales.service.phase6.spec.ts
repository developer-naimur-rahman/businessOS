import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { SalesRepository } from './sales.repository';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../business-core/services/products.service';
import { VariantsService } from '../business-core/services/variants.service';
import { WarehousesService } from '../operational-structure/warehouses/warehouses.service';
import { CustomersService } from '../business-core/services/customers.service';
import { BranchesService } from '../operational-structure/branches/branches.service';
import { BadRequestException } from '@nestjs/common';
import { Prisma, PaymentMethod, ProductType } from '@prisma/client';
import { PrismaClientManager } from '../common/prisma/prisma-client.manager';

describe('SalesService - Phase 6 Tests', () => {
  let service: SalesService;
  let salesRepo: jest.Mocked<SalesRepository>;
  let inventoryService: jest.Mocked<InventoryService>;
  let productsService: jest.Mocked<ProductsService>;
  let variantsService: jest.Mocked<VariantsService>;
  let warehousesService: jest.Mocked<WarehousesService>;
  let branchesService: jest.Mocked<BranchesService>;

  const mockPrismaClientManager = {
    client: {
      outboxEvent: {
        create: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    salesRepo = {
      findById: jest.fn(),
      findPaymentByIdempotencyKey: jest.fn(),
      runTransaction: jest.fn((cb) => cb()),
      createSale: jest.fn(),
      updatePaymentStatus: jest.fn(),
      addPayment: jest.fn(),
      generateSaleNumber: jest.fn().mockResolvedValue('SALE-2026-000001'),
    } as any;

    inventoryService = { deductStockForSale: jest.fn() } as any;
    productsService = { findOne: jest.fn() } as any;
    variantsService = { findOne: jest.fn() } as any;
    warehousesService = { findOne: jest.fn().mockResolvedValue({ id: 'w-1', branchId: 'b-1', isActive: true }) } as any;
    branchesService = { findOne: jest.fn().mockResolvedValue({ id: 'b-1', isActive: true }) } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: SalesRepository, useValue: salesRepo },
        { provide: InventoryService, useValue: inventoryService },
        { provide: ProductsService, useValue: productsService },
        { provide: VariantsService, useValue: variantsService },
        { provide: WarehousesService, useValue: warehousesService },
        { provide: CustomersService, useValue: {} },
        { provide: BranchesService, useValue: branchesService },
        { provide: PrismaClientManager, useValue: mockPrismaClientManager },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  describe('addPayment', () => {
    it('should reject payment for non-existent sale', async () => {
      salesRepo.findById.mockResolvedValue(null);
      await expect(service.addPayment('org-1', 'invalid', { amount: 100, method: 'CASH', paymentDate: new Date() })).rejects.toThrow('Sale not found');
    });

    it('should reject payment for non-COMPLETED sale', async () => {
      salesRepo.findById.mockResolvedValue({ status: 'DRAFT', payments: [] } as any);
      await expect(service.addPayment('org-1', 's-1', { amount: 100, method: 'CASH', paymentDate: new Date() })).rejects.toThrow('Payments can only be added to COMPLETED sales.');
    });

    it('should reject payment exceeding outstanding balance', async () => {
      salesRepo.findById.mockResolvedValue({ 
        status: 'COMPLETED', 
        total: new Prisma.Decimal(1000),
        payments: [{ amount: new Prisma.Decimal(900) }]
      } as any);
      // Outstanding is 100, trying to pay 200
      await expect(service.addPayment('org-1', 's-1', { amount: 200, method: 'CASH', paymentDate: new Date() })).rejects.toThrow('Payment exceeds outstanding balance.');
    });

    it('should accept exact outstanding payment and update status to PAID', async () => {
      salesRepo.findById.mockResolvedValue({ 
        id: 's-1',
        status: 'COMPLETED', 
        paymentStatus: 'PARTIALLY_PAID',
        total: new Prisma.Decimal(1000),
        payments: [{ amount: new Prisma.Decimal(800) }]
      } as any);
      salesRepo.addPayment.mockResolvedValue({ id: 'sp-1', amount: new Prisma.Decimal(200) } as any);
      mockPrismaClientManager.client.outboxEvent.create.mockResolvedValue({ id: 'event-1' } as any);

      const result = await service.addPayment('org-1', 's-1', { amount: 200, method: 'CASH', paymentDate: new Date() });
      
      expect(salesRepo.addPayment).toHaveBeenCalled();
      expect(salesRepo.updatePaymentStatus).toHaveBeenCalledWith('org-1', 's-1', 'PAID');
      expect(mockPrismaClientManager.client.outboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ eventType: 'SALE_PAYMENT', aggregateId: 'sp-1' })
      });
      expect(result.id).toBe('sp-1');
    });

    it('should return existing payment if idempotencyKey matches', async () => {
      salesRepo.findById.mockResolvedValue({ status: 'COMPLETED', total: new Prisma.Decimal(1000), payments: [] } as any);
      salesRepo.findPaymentByIdempotencyKey.mockResolvedValue({ id: 'sp-existing', amount: new Prisma.Decimal(500) } as any);
      
      const result = await service.addPayment('org-1', 's-1', { amount: 500, method: 'CASH', paymentDate: new Date(), idempotencyKey: 'idemp-123' });
      
      expect(result.id).toBe('sp-existing');
      expect(salesRepo.addPayment).not.toHaveBeenCalled();
    });
  });
});
