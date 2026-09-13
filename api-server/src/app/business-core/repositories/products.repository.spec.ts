import { Test, TestingModule } from '@nestjs/testing';
import { ProductsRepository } from './products.repository';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductsRepository - Tenant Isolation', () => {
  let repository: ProductsRepository;
  let prisma: jest.Mocked<Partial<PrismaService>>;

  beforeEach(async () => {
    prisma = { product: { findUnique: jest.fn() } as any };
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();
    repository = module.get<ProductsRepository>(ProductsRepository);
  });

  it('should throw NotFoundException on cross-tenant lookup', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue({ id: 'prod-1', organizationId: 'org-B' });
    await expect(repository.findByIdAndOrganization('org-A', 'prod-1')).rejects.toThrow(NotFoundException);
  });
});
