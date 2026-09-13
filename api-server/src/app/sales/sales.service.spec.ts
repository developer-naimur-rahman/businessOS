import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { SalesRepository } from './sales.repository';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../business-core/services/products.service';
import { WarehousesService } from '../operational-structure/warehouses/warehouses.service';
import { CustomersService } from '../business-core/services/customers.service';
import { BranchesService } from '../operational-structure/branches/branches.service';
import { BadRequestException } from '@nestjs/common';
import { Prisma, PaymentMethod, ProductType } from '@prisma/client';
import { PrismaClientManager } from '../common/prisma/prisma-client.manager';

describe('SalesService', () => {
  let service: SalesService;
  let salesRepo: jest.Mocked<SalesRepository>;
  let inventoryService: jest.Mocked<InventoryService>;
  let productsService: jest.Mocked<ProductsService>;
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
      findByIdempotencyKey: jest.fn(),
      runTransaction: jest.fn((cb) => cb()),
      createSale: jest.fn(),
      generateSaleNumber: jest.fn().mockResolvedValue('SALE-2026-000001'),
    } as any;

    inventoryService = {
      deductStockForSale: jest.fn(),
    } as any;

    productsService = {
      findOne: jest.fn(),
    } as any;

    warehousesService = {
      findOne: jest.fn().mockResolvedValue({ id: 'w-1', branchId: 'b-1', isActive: true }),
    } as any;

    branchesService = {
      findOne: jest.fn().mockResolvedValue({ id: 'b-1', isActive: true }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: SalesRepository, useValue: salesRepo },
        { provide: InventoryService, useValue: inventoryService },
        { provide: ProductsService, useValue: productsService },
        { provide: WarehousesService, useValue: warehousesService },
        { provide: CustomersService, useValue: {} },
        { provide: BranchesService, useValue: branchesService },
        { provide: PrismaClientManager, useValue: mockPrismaClientManager },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  describe('createDirectSale', () => {
    it('should throw if physical product line has insufficient stock (inventory service throws)', async () => {
      productsService.findOne.mockResolvedValue({ id: 'p-1', isActive: true, type: 'PRODUCT', sellingPrice: new Prisma.Decimal(10) } as any);
      
      salesRepo.createSale.mockResolvedValue({ id: 's-1' } as any);
      
      inventoryService.deductStockForSale.mockRejectedValue(new BadRequestException('Insufficient stock'));

      const dto = {
        branchId: 'b-1',
        warehouseId: 'w-1',
        lines: [{ productId: 'p-1', quantity: 2 }],
      };

      await expect(service.createDirectSale('org-1', dto, 'u-1')).rejects.toThrow(BadRequestException);
    });

    it('should NOT call inventoryService for SERVICE products', async () => {
      productsService.findOne.mockResolvedValue({ id: 'p-1', isActive: true, type: 'SERVICE', sellingPrice: new Prisma.Decimal(50) } as any);
      
      salesRepo.createSale.mockResolvedValue({ id: 's-1' } as any);
      
      const dto = {
        branchId: 'b-1',
        warehouseId: 'w-1',
        lines: [{ productId: 'p-1', quantity: 1 }],
      };

      await service.createDirectSale('org-1', dto, 'u-1');

      expect(inventoryService.deductStockForSale).not.toHaveBeenCalled();
      expect(salesRepo.createSale).toHaveBeenCalledWith(expect.objectContaining({
        total: new Prisma.Decimal(50),
      }));
    });

    it('should throw on cross-tenant/inactive warehouse reference', async () => {
      warehousesService.findOne.mockResolvedValue({ id: 'w-1', branchId: 'b-2', isActive: true } as any); // Belongs to wrong branch

      const dto = {
        branchId: 'b-1',
        warehouseId: 'w-1',
        lines: [{ productId: 'p-1', quantity: 1 }],
      };

      await expect(service.createDirectSale('org-1', dto, 'u-1')).rejects.toThrow('Warehouse does not belong to the specified branch');
    });

    it('should process payment correctly', async () => {
      productsService.findOne.mockResolvedValue({ id: 'p-1', isActive: true, type: 'SERVICE', sellingPrice: new Prisma.Decimal(100) } as any);
      salesRepo.createSale.mockResolvedValue({ id: 's-1' } as any);

      const dto = {
        branchId: 'b-1',
        warehouseId: 'w-1',
        lines: [{ productId: 'p-1', quantity: 1 }],
        payments: [{ method: PaymentMethod.CASH, amount: 100 }],
      };

      await service.createDirectSale('org-1', dto, 'u-1');

      expect(salesRepo.createSale).toHaveBeenCalledWith(expect.objectContaining({
        paymentStatus: 'PAID',
      }));
    });

    it('should throw on overpayment', async () => {
      productsService.findOne.mockResolvedValue({ id: 'p-1', isActive: true, type: 'SERVICE', sellingPrice: new Prisma.Decimal(100) } as any);
      
      const dto = {
        branchId: 'b-1',
        warehouseId: 'w-1',
        lines: [{ productId: 'p-1', quantity: 1 }],
        payments: [{ method: PaymentMethod.CASH, amount: 150 }],
      };

      await expect(service.createDirectSale('org-1', dto, 'u-1')).rejects.toThrow('Overpayment is not supported');
    });
  });
});
