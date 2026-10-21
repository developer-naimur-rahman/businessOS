import { Test, TestingModule } from '@nestjs/testing';
import { StorefrontService } from './storefront.service';
import { ProductsService } from '../business-core/services/products.service';
import { QuoteEngineService } from './quote-engine.service';
import { StorageService } from '../storage/storage.service';
import { SalesService } from '../sales/sales.service';
import { PrismaClientManager } from '../common/prisma/prisma-client.manager';
import { ProductType, ProductStatus, Prisma } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('StorefrontService', () => {
  let service: StorefrontService;
  let productsService: jest.Mocked<ProductsService>;
  let quoteEngine: jest.Mocked<QuoteEngineService>;
  let storageService: jest.Mocked<StorageService>;
  let salesService: jest.Mocked<SalesService>;
  let prismaManager: any;
  let mockPrismaClient: any;

  beforeEach(async () => {
    mockPrismaClient = {
      productVariant: {
        findFirst: jest.fn(),
      },
      saleLine: {
        update: jest.fn(),
      },
    };

    prismaManager = {
      get client() { return mockPrismaClient; }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorefrontService,
        {
          provide: ProductsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: QuoteEngineService,
          useValue: {
            calculateQuote: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            createUnattachedUpload: jest.fn(),
            attachToSaleLine: jest.fn(),
          },
        },
        {
          provide: SalesService,
          useValue: {
            createDirectSale: jest.fn(),
          },
        },
        {
          provide: PrismaClientManager,
          useValue: prismaManager,
        },
      ],
    }).compile();

    service = module.get<StorefrontService>(StorefrontService);
    productsService = module.get(ProductsService);
    quoteEngine = module.get(QuoteEngineService);
    storageService = module.get(StorageService);
    salesService = module.get(SalesService);
  });

  const emptyMeta = { page: 1, pageSize: 20, total: 0, totalPages: 0 };

  describe('Product catalog', () => {
    it('should query physical products only with correct organization isolation', async () => {
      productsService.findAll.mockResolvedValue({ items: [], meta: emptyMeta });
      await service.getCatalogProducts('org-1', { page: 1 });
      
      expect(productsService.findAll).toHaveBeenCalledWith('org-1', {
        page: 1,
        type: ProductType.PRODUCT,
        status: ProductStatus.ACTIVE,
        isOnlineVisible: true,
      });
    });
  });

  describe('Service catalog', () => {
    it('should query service products only with correct organization isolation', async () => {
      productsService.findAll.mockResolvedValue({ items: [], meta: emptyMeta });
      await service.getCatalogServices('org-1', { page: 2 });
      
      expect(productsService.findAll).toHaveBeenCalledWith('org-1', {
        page: 2,
        type: ProductType.SERVICE,
        status: ProductStatus.ACTIVE,
        isOnlineVisible: true,
      });
    });
  });

  describe('Search', () => {
    it('should distinguish products and services', async () => {
      productsService.findAll.mockResolvedValue({
        items: [
          { id: '1', type: ProductType.PRODUCT },
          { id: '2', type: ProductType.SERVICE },
        ],
        meta: emptyMeta
      } as any);

      const result = await service.search('org-1', 'test query');

      expect(productsService.findAll).toHaveBeenCalledWith('org-1', {
        search: 'test query',
        page: 1,
        limit: 20,
        status: ProductStatus.ACTIVE,
        isOnlineVisible: true,
      });
      
      expect(result.items[0].discriminator).toBe('PRODUCT');
      expect(result.items[1].discriminator).toBe('SERVICE');
    });
  });

  describe('Service quote', () => {
    it('should throw if product is not a service', async () => {
      productsService.findOne.mockResolvedValue({ id: 'p-1', type: ProductType.PRODUCT } as any);
      
      await expect(service.quoteService('org-1', 'p-1', { configuration: {} }))
        .rejects.toThrow(BadRequestException);
    });

    it('should delegate to authoritative QuoteEngine', async () => {
      productsService.findOne.mockResolvedValue({ 
        id: 'p-1', 
        type: ProductType.SERVICE,
        variants: [{ id: 'v-1' }]
      } as any);

      quoteEngine.calculateQuote.mockResolvedValue({
        finalUnitPrice: new Prisma.Decimal(10),
      } as any);

      const quote = await service.quoteService('org-1', 'p-1', { configuration: { color: 'red' }, quantity: 5 });

      expect(quoteEngine.calculateQuote).toHaveBeenCalledWith('org-1', 'p-1', 'v-1', { color: 'red' }, 5);
      expect(quote.finalUnitPrice.toNumber()).toBe(10);
    });
  });

  describe('Product checkout', () => {
    it('should use authoritative DB price and create direct sale', async () => {
      mockPrismaClient.productVariant.findFirst.mockResolvedValue({
        id: 'v-1',
        retailPrice: new Prisma.Decimal(50.0),
        product: { type: ProductType.PRODUCT }
      });

      salesService.createDirectSale.mockResolvedValue({ id: 'sale-1' } as any);

      await service.checkoutProduct('org-1', 'cust-1', {
        variantId: 'v-1',
        quantity: 2,
        branchId: 'b-1',
        warehouseId: 'w-1',
      }, 'user-1');

      expect(salesService.createDirectSale).toHaveBeenCalledWith('org-1', {
        customerId: 'cust-1',
        branchId: 'b-1',
        warehouseId: 'w-1',
        lines: [
          {
            variantId: 'v-1',
            quantity: 2,
          }
        ]
      }, 'user-1', { 'v-1': 50.0 });
    });
  });

  describe('Service checkout', () => {
    it('should recalculate price and snapshot configuration and files', async () => {
      mockPrismaClient.productVariant.findFirst.mockResolvedValue({
        id: 'v-1',
        productId: 'p-1',
        product: { type: ProductType.SERVICE }
      });

      quoteEngine.calculateQuote.mockResolvedValue({
        finalUnitPrice: new Prisma.Decimal(75.5),
        normalizedConfiguration: { resolved: true }
      } as any);

      salesService.createDirectSale.mockResolvedValue({
        id: 'sale-1',
        lines: [{ id: 'sl-1', variantId: 'v-1' }]
      } as any);

      await service.checkoutService('org-1', 'cust-1', {
        variantId: 'v-1',
        branchId: 'b-1',
        warehouseId: 'w-1',
        quantity: 1,
        configuration: { submitted: true },
        storageObjectIds: ['so-1']
      }, 'user-1');

      // 1. Recalculated quote
      expect(quoteEngine.calculateQuote).toHaveBeenCalledWith('org-1', 'p-1', 'v-1', { submitted: true }, 1);

      // 2. Created sale with server-side price
      expect(salesService.createDirectSale).toHaveBeenCalledWith('org-1', {
        customerId: 'cust-1',
        branchId: 'b-1',
        warehouseId: 'w-1',
        lines: [
          {
            variantId: 'v-1',
            quantity: 1,
          }
        ]
      }, 'user-1', { 'v-1': 75.5 });

      // 3. Updated sale line with snapshot and fulfillment status
      expect(mockPrismaClient.saleLine.update).toHaveBeenCalledWith({
        where: { id: 'sl-1' },
        data: {
          configurationSnapshot: { resolved: true },
          fulfillmentStatus: 'QUEUED' // QUEUED because we provided storageObjectIds
        }
      });

      // 4. Linked storage objects
      expect(storageService.attachToSaleLine).toHaveBeenCalledWith('org-1', 'so-1', 'sl-1');
    });
  });
});
