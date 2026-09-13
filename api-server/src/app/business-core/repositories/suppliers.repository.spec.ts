import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersRepository } from './suppliers.repository';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('SuppliersRepository - Tenant Isolation', () => {
  let repository: SuppliersRepository;
  let prisma: jest.Mocked<Partial<PrismaService>>;

  beforeEach(async () => {
    prisma = { supplier: { findUnique: jest.fn() } as any };
    const module: TestingModule = await Test.createTestingModule({
      providers: [SuppliersRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();
    repository = module.get<SuppliersRepository>(SuppliersRepository);
  });

  it('should throw NotFoundException on cross-tenant lookup', async () => {
    (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({ id: 'sup-1', organizationId: 'org-B' });
    await expect(repository.findByIdAndOrganization('org-A', 'sup-1')).rejects.toThrow(NotFoundException);
  });
});
