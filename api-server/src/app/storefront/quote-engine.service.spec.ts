import { Test, TestingModule } from '@nestjs/testing';
import { QuoteEngineService, ServiceConfigSchema } from './quote-engine.service';
import { Prisma } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClientManager } from '../common/prisma/prisma-client.manager';

describe('QuoteEngineService', () => {
  let service: QuoteEngineService;
  let mockPrismaClient: any;

  beforeEach(async () => {
    mockPrismaClient = {
      product: {
        findFirst: jest.fn(),
      },
    };

    const mockPrismaManager = {
      get client() { return mockPrismaClient; }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuoteEngineService,
        { provide: PrismaClientManager, useValue: mockPrismaManager },
      ],
    }).compile();

    service = module.get<QuoteEngineService>(QuoteEngineService);
  });

  const setupMockProduct = (type: string, price: number, schema: any) => {
    mockPrismaClient.product.findFirst.mockResolvedValue({
      id: 'prod-1',
      organizationId: 'org-1',
      type,
      serviceConfigSchema: schema,
      variants: [
        {
          id: 'var-1',
          organizationId: 'org-1',
          retailPrice: new Prisma.Decimal(price),
          status: 'ACTIVE',
        },
      ],
    });
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Example A - Fixed service (no schema)', async () => {
    setupMockProduct('SERVICE', 100, null);
    const result = await service.calculateQuote('org-1', 'prod-1', 'var-1', {}, 1);
    expect(result.basePrice.toNumber()).toBe(100);
    expect(result.finalUnitPrice.toNumber()).toBe(100);
    expect(result.finalLineTotal.toNumber()).toBe(100);
    expect(result.unitMultiplier.toNumber()).toBe(1);
    expect(result.normalizedConfiguration).toEqual({});
  });

  it('Example B - Printing (Base 5, Pages 50, Color +5 PER_UNIT)', async () => {
    const schema: ServiceConfigSchema = {
      fields: [
        {
          key: 'pages',
          type: 'number',
          label: 'Pages',
          required: true,
          min: 1,
          isUnitMultiplier: true,
        },
        {
          key: 'color',
          type: 'select',
          label: 'Color Mode',
          options: [
            { value: 'bw', label: 'B&W', priceDelta: { type: 'PER_UNIT', value: 0 } },
            { value: 'color', label: 'Color', priceDelta: { type: 'PER_UNIT', value: 5 } },
          ],
        },
      ],
    };
    setupMockProduct('SERVICE', 5, schema);

    const result = await service.calculateQuote('org-1', 'prod-1', 'var-1', { pages: 50, color: 'color' }, 1);

    expect(result.basePrice.toNumber()).toBe(5);
    expect(result.unitMultiplier.toNumber()).toBe(50);
    expect(result.modifiersTotal.toNumber()).toBe(250);
    expect(result.finalUnitPrice.toNumber()).toBe(255);
    expect(result.finalLineTotal.toNumber()).toBe(255);
    expect(result.normalizedConfiguration).toEqual({ pages: 50, color: 'color' });
  });

  it('should handle quantity correctly', async () => {
    setupMockProduct('SERVICE', 100, null);
    const result = await service.calculateQuote('org-1', 'prod-1', 'var-1', {}, 3);
    expect(result.basePrice.toNumber()).toBe(100);
    expect(result.finalUnitPrice.toNumber()).toBe(100);
    expect(result.finalLineTotal.toNumber()).toBe(300);
    expect(result.quantity.toNumber()).toBe(3);
  });

  it('should throw if productType is not SERVICE', async () => {
    setupMockProduct('PRODUCT', 100, null);
    await expect(service.calculateQuote('org-1', 'prod-1', 'var-1', {}, 1)).rejects.toThrow(BadRequestException);
  });

  it('should throw if missing required field', async () => {
    const schema: ServiceConfigSchema = {
      fields: [{ key: 'paperSize', type: 'text', label: 'Size', required: true }],
    };
    setupMockProduct('SERVICE', 0, schema);
    await expect(service.calculateQuote('org-1', 'prod-1', 'var-1', {}, 1)).rejects.toThrow(BadRequestException);
  });

  it('should throw on unknown field', async () => {
    const schema: ServiceConfigSchema = {
      fields: [{ key: 'paperSize', type: 'text', label: 'Size' }],
    };
    setupMockProduct('SERVICE', 0, schema);
    await expect(service.calculateQuote('org-1', 'prod-1', 'var-1', { unknown: 'val' }, 1)).rejects.toThrow(BadRequestException);
  });

  it('should throw on invalid select option', async () => {
    const schema: ServiceConfigSchema = {
      fields: [
        {
          key: 'size',
          type: 'select',
          label: 'Size',
          options: [{ value: 'A4', label: 'A4' }],
        },
      ],
    };
    setupMockProduct('SERVICE', 0, schema);
    await expect(service.calculateQuote('org-1', 'prod-1', 'var-1', { size: 'A3' }, 1)).rejects.toThrow(BadRequestException);
  });

  it('should throw on number below min', async () => {
    const schema: ServiceConfigSchema = {
      fields: [{ key: 'pages', type: 'number', label: 'Pages', min: 10 }],
    };
    setupMockProduct('SERVICE', 0, schema);
    await expect(service.calculateQuote('org-1', 'prod-1', 'var-1', { pages: 5 }, 1)).rejects.toThrow(BadRequestException);
  });

  it('should evaluate FIXED modifiers correctly', async () => {
    const schema: ServiceConfigSchema = {
      fields: [
        {
          key: 'binding',
          type: 'select',
          label: 'Binding',
          options: [
            { value: 'none', label: 'None' },
            { value: 'spiral', label: 'Spiral', priceDelta: { type: 'FIXED', value: 50 } },
          ],
        },
      ],
    };
    setupMockProduct('SERVICE', 10, schema);

    const result = await service.calculateQuote('org-1', 'prod-1', 'var-1', { binding: 'spiral' }, 2);

    expect(result.basePrice.toNumber()).toBe(10);
    expect(result.modifiersTotal.toNumber()).toBe(50);
    expect(result.finalUnitPrice.toNumber()).toBe(60);
    expect(result.finalLineTotal.toNumber()).toBe(120);
  });

  it('should handle decimal money values safely', async () => {
    const schema: ServiceConfigSchema = {
      fields: [
        {
          key: 'addon',
          type: 'select',
          label: 'Addon',
          options: [{ value: 'yes', label: 'Yes', priceDelta: { type: 'FIXED', value: 0.1 } }]
        }
      ]
    };
    setupMockProduct('SERVICE', 0.2, schema);

    const result = await service.calculateQuote('org-1', 'prod-1', 'var-1', { addon: 'yes' }, 1);
    
    expect(result.finalUnitPrice.toNumber()).toBe(0.3);
  });
});
