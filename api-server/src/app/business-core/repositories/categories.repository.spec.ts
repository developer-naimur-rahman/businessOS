import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesRepository } from './categories.repository';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CategoriesRepository - Tenant Isolation', () => {
  let repository: CategoriesRepository;
  let prisma: jest.Mocked<Partial<PrismaService>>;

  beforeEach(async () => {
    prisma = { category: { findUnique: jest.fn() } as any };
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriesRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();
    repository = module.get<CategoriesRepository>(CategoriesRepository);
  });

  it('should throw NotFoundException on cross-tenant lookup', async () => {
    (prisma.category.findUnique as jest.Mock).mockResolvedValue({ id: 'cat-1', organizationId: 'org-B' });
    await expect(repository.findByIdAndOrganization('org-A', 'cat-1')).rejects.toThrow(NotFoundException);
  });
});
