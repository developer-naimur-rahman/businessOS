import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ProductsRepository } from '../repositories/products.repository';
import { CategoriesRepository } from '../repositories/categories.repository';
import { UnitsRepository } from '../repositories/units.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let productsRepo: jest.Mocked<ProductsRepository>;
  let categoriesRepo: jest.Mocked<CategoriesRepository>;
  let unitsRepo: jest.Mocked<UnitsRepository>;

  beforeEach(async () => {
    productsRepo = { create: jest.fn(), update: jest.fn() } as any;
    categoriesRepo = { findByIdAndOrganization: jest.fn() } as any;
    unitsRepo = { findByIdAndOrganization: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: ProductsRepository, useValue: productsRepo },
        { provide: CategoriesRepository, useValue: categoriesRepo },
        { provide: UnitsRepository, useValue: unitsRepo },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should reject negative sellingPrice', async () => {
    await expect(service.create('org-A', { sellingPrice: -10 }))
      .rejects
      .toThrow(BadRequestException);
  });

  it('should reject negative costPrice', async () => {
    await expect(service.create('org-A', { costPrice: -5 }))
      .rejects
      .toThrow(BadRequestException);
  });

  it('should reject cross-tenant category relation', async () => {
    categoriesRepo.findByIdAndOrganization.mockRejectedValue(new NotFoundException());
    await expect(service.create('org-A', { categoryId: 'cat-org-B' }))
      .rejects
      .toThrow(NotFoundException);
  });

  it('should reject cross-tenant unit relation', async () => {
    unitsRepo.findByIdAndOrganization.mockRejectedValue(new NotFoundException());
    await expect(service.create('org-A', { unitId: 'unit-org-B' }))
      .rejects
      .toThrow(NotFoundException);
  });

  it('should create product successfully', async () => {
    categoriesRepo.findByIdAndOrganization.mockResolvedValue({} as any);
    unitsRepo.findByIdAndOrganization.mockResolvedValue({} as any);
    productsRepo.create.mockResolvedValue({ id: 'prod-1' } as any);

    const result = await service.create('org-A', {
      sellingPrice: 10,
      costPrice: 5,
      categoryId: 'cat-A',
      unitId: 'unit-A',
    });

    expect(result).toEqual({ id: 'prod-1' });
    expect(categoriesRepo.findByIdAndOrganization).toHaveBeenCalledWith('org-A', 'cat-A');
    expect(unitsRepo.findByIdAndOrganization).toHaveBeenCalledWith('org-A', 'unit-A');
  });
});
