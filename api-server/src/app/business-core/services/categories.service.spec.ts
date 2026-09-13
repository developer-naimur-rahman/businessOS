import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from '../repositories/categories.repository';
import { NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoriesRepo: jest.Mocked<CategoriesRepository>;

  beforeEach(async () => {
    categoriesRepo = { create: jest.fn(), update: jest.fn(), findByIdAndOrganization: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: CategoriesRepository, useValue: categoriesRepo },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should reject cross-tenant parent category relation on create', async () => {
    categoriesRepo.findByIdAndOrganization.mockRejectedValue(new NotFoundException());
    await expect(service.create('org-A', { parent: { connect: { id: 'cat-org-B' } }, name: 'cat' }))
      .rejects
      .toThrow(NotFoundException);
  });
  
  it('should accept same-tenant parent category relation on create', async () => {
    categoriesRepo.findByIdAndOrganization.mockResolvedValue({} as any);
    categoriesRepo.create.mockResolvedValue({ id: 'cat-new' } as any);

    const result = await service.create('org-A', { parent: { connect: { id: 'cat-org-A' } }, name: 'cat' });
    expect(result).toEqual({ id: 'cat-new' });
    expect(categoriesRepo.findByIdAndOrganization).toHaveBeenCalledWith('org-A', 'cat-org-A');
  });
});
