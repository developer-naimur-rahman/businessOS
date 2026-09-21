import { PurchasesService } from './purchases.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesRepository } from '../repositories/purchases.repository';
import { SuppliersRepository } from '../../business-core/repositories/suppliers.repository';
import { WarehousesService } from '../../operational-structure/warehouses/warehouses.service';
import { BranchesService } from '../../operational-structure/branches/branches.service';
import { VariantsService } from '../../business-core/services/variants.service';
import { InventoryService } from '../../inventory/inventory.service';
import { PrismaClientManager } from '../../common/prisma/prisma-client.manager';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PurchaseStatus } from '@prisma/client';

describe('PurchasesService', () => {
  let service: PurchasesService;
  let repo: jest.Mocked<any>;
  let suppliersRepo: jest.Mocked<any>;
  let warehousesService: jest.Mocked<any>;
  let branchesService: jest.Mocked<any>;
  let variantsService: jest.Mocked<any>;
  let inventoryService: jest.Mocked<any>;
  let prismaManager: jest.Mocked<any>;

  beforeEach(async () => {
    repo = {
      findMany: jest.fn(),
      findOne: jest.fn(),
      findOneWithDetails: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addPayment: jest.fn(),
      runTransaction: jest.fn().mockImplementation((cb) => cb()),
    };
    suppliersRepo = { findByIdAndOrganization: jest.fn() };
    warehousesService = { findOne: jest.fn() };
    branchesService = { findOne: jest.fn() };
    variantsService = { findOne: jest.fn() };
    inventoryService = { createReceipt: jest.fn().mockResolvedValue([]) };
    prismaManager = {
      client: {
        product: { findUnique: jest.fn() },
        outboxEvent: { create: jest.fn() },
        purchaseLine: { deleteMany: jest.fn() },
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesService,
        { provide: PurchasesRepository, useValue: repo },
        { provide: SuppliersRepository, useValue: suppliersRepo },
        { provide: WarehousesService, useValue: warehousesService },
        { provide: BranchesService, useValue: branchesService },
        { provide: VariantsService, useValue: variantsService },
        { provide: InventoryService, useValue: inventoryService },
        { provide: PrismaClientManager, useValue: prismaManager },
      ],
    }).compile();

    service = module.get<PurchasesService>(PurchasesService);

    // Default happy-path mocks
    suppliersRepo.findByIdAndOrganization.mockResolvedValue({ id: 'sup-1', status: 'ACTIVE' });
    warehousesService.findOne.mockResolvedValue({ id: 'wh-1', isActive: true, branchId: null });
    branchesService.findOne.mockResolvedValue({ id: 'br-1', isActive: true });
    variantsService.findOne.mockResolvedValue({ id: 'v-1', productId: 'prod-1', sku: 'SKU-001', costPrice: 100 });
    prismaManager.client.product.findUnique.mockResolvedValue({ id: 'prod-1', type: 'PRODUCT', name: 'Test Product' });
  });

  const makeDto = (overrides?: any) => ({
    supplierId: 'sup-1',
    warehouseId: 'wh-1',
    purchaseDate: '2026-09-20T00:00:00.000Z',
    lines: [{ variantId: 'v-1', quantity: 10, unitCost: 100 }],
    ...overrides,
  });

  // =========================================================================
  // createDraft
  // =========================================================================
  describe('createDraft', () => {
    it('should create draft purchase successfully', async () => {
      repo.create.mockResolvedValue({ id: 'po-1', status: PurchaseStatus.DRAFT });
      const result = await service.createDraft('org-1', 'user-1', makeDto());
      expect(result.id).toBe('po-1');
      expect(result.status).toBe(PurchaseStatus.DRAFT);
      expect(repo.create).toHaveBeenCalledWith('org-1', expect.objectContaining({
        status: PurchaseStatus.DRAFT,
      }));
    });

    it('should reject inactive supplier', async () => {
      suppliersRepo.findByIdAndOrganization.mockResolvedValue({ status: 'INACTIVE' });
      await expect(service.createDraft('org-1', 'user-1', makeDto())).rejects.toThrow(BadRequestException);
    });

    it('should reject null supplier (cross-tenant)', async () => {
      suppliersRepo.findByIdAndOrganization.mockResolvedValue(null);
      await expect(service.createDraft('org-1', 'user-1', makeDto())).rejects.toThrow(BadRequestException);
    });

    it('should reject SERVICE products', async () => {
      prismaManager.client.product.findUnique.mockResolvedValue({ type: 'SERVICE', name: 'Svc' });
      await expect(service.createDraft('org-1', 'user-1', makeDto())).rejects.toThrow(BadRequestException);
    });

    it('should reject negative line total (discount > subtotal)', async () => {
      await expect(service.createDraft('org-1', 'user-1', makeDto({
        lines: [{ variantId: 'v-1', quantity: 1, unitCost: 10, discount: 50 }],
      }))).rejects.toThrow(BadRequestException);
    });

    it('should reject if total purchase is negative (totalDiscount > subtotal)', async () => {
      await expect(service.createDraft('org-1', 'user-1', makeDto({
        totalDiscount: 999999,
      }))).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // updateDraft
  // =========================================================================
  describe('updateDraft', () => {
    it('should update draft', async () => {
      repo.findOneWithDetails.mockResolvedValue({ id: 'po-1', status: PurchaseStatus.DRAFT, lines: [] });
      repo.update.mockResolvedValue({ id: 'po-1', status: PurchaseStatus.DRAFT });
      const result = await service.updateDraft('org-1', 'po-1', makeDto());
      expect(result.id).toBe('po-1');
    });

    it('should reject update if completed (immutability)', async () => {
      repo.findOneWithDetails.mockResolvedValue({ id: 'po-1', status: PurchaseStatus.COMPLETED });
      await expect(service.updateDraft('org-1', 'po-1', makeDto())).rejects.toThrow(BadRequestException);
    });

    it('should reject update if purchase not found', async () => {
      repo.findOneWithDetails.mockResolvedValue(null);
      await expect(service.updateDraft('org-1', 'po-FAKE', makeDto())).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // completePurchase
  // =========================================================================
  describe('completePurchase', () => {
    it('should complete purchase, trigger inventory receipt, and create outbox event', async () => {
      repo.findOneWithDetails.mockResolvedValue({
        id: 'po-1',
        status: PurchaseStatus.DRAFT,
        warehouseId: 'wh-1',
        branchId: null,
        lines: [{ variantId: 'v-1', quantity: 10, unitCost: 100 }],
      });
      repo.update.mockResolvedValue({ id: 'po-1', status: PurchaseStatus.COMPLETED });

      const result = await service.completePurchase('org-1', 'po-1', 'user-1');
      expect(result.status).toBe(PurchaseStatus.COMPLETED);
      expect(inventoryService.createReceipt).toHaveBeenCalledWith(
        'org-1', 'wh-1',
        [{ variantId: 'v-1', quantity: 10, unitCost: 100 }],
        'po-1', 'user-1',
        'PURCHASE-RECEIPT-po-1',
      );
      expect(prismaManager.client.outboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'PURCHASE_COMPLETED',
          aggregateType: 'Purchase',
          aggregateId: 'po-1',
        }),
      });
    });

    it('should reject if already completed (immutability)', async () => {
      repo.findOneWithDetails.mockResolvedValue({ status: PurchaseStatus.COMPLETED });
      await expect(service.completePurchase('org-1', 'po-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject if purchase not found (cross-tenant)', async () => {
      repo.findOneWithDetails.mockResolvedValue(null);
      await expect(service.completePurchase('org-1', 'po-FAKE', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // addPayment
  // =========================================================================
  describe('addPayment', () => {
    it('should add payment to completed purchase', async () => {
      repo.findOneWithDetails.mockResolvedValue({
        id: 'po-1',
        status: PurchaseStatus.COMPLETED,
        total: 10000,
        payments: [],
      });
      repo.addPayment.mockResolvedValue({ id: 'pay-1' });

      const result = await service.addPayment('org-1', 'po-1', {
        amount: 5000, method: 'CASH', paymentDate: '2026-09-20T00:00:00Z',
      } as any);
      expect(result.id).toBe('pay-1');
      expect(prismaManager.client.outboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'PURCHASE_PAYMENT',
          aggregateType: 'Purchase',
        }),
      });
    });

    it('should reject payment on DRAFT purchase', async () => {
      repo.findOneWithDetails.mockResolvedValue({ status: PurchaseStatus.DRAFT });
      await expect(service.addPayment('org-1', 'po-1', {
        amount: 5000, method: 'CASH', paymentDate: '2026-09-20T00:00:00Z',
      } as any)).rejects.toThrow(BadRequestException);
    });

    it('should reject overpayment', async () => {
      repo.findOneWithDetails.mockResolvedValue({
        status: PurchaseStatus.COMPLETED,
        total: 10000,
        payments: [{ amount: 8000 }],
      });
      await expect(service.addPayment('org-1', 'po-1', {
        amount: 3000, method: 'CASH', paymentDate: '2026-09-20T00:00:00Z',
      } as any)).rejects.toThrow(BadRequestException);
    });

    it('should reject if purchase not found (cross-tenant)', async () => {
      repo.findOneWithDetails.mockResolvedValue(null);
      await expect(service.addPayment('org-1', 'po-FAKE', {
        amount: 5000, method: 'CASH', paymentDate: '2026-09-20T00:00:00Z',
      } as any)).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // findOne (tenant isolation)
  // =========================================================================
  describe('findOne', () => {
    it('should return purchase for correct org', async () => {
      repo.findOneWithDetails.mockResolvedValue({ id: 'po-1' });
      const result = await service.findOne('org-1', 'po-1');
      expect(result.id).toBe('po-1');
      expect(repo.findOneWithDetails).toHaveBeenCalledWith('org-1', 'po-1');
    });

    it('should throw not found for wrong org (cross-tenant)', async () => {
      repo.findOneWithDetails.mockResolvedValue(null);
      await expect(service.findOne('org-WRONG', 'po-1')).rejects.toThrow(NotFoundException);
    });
  });
});
