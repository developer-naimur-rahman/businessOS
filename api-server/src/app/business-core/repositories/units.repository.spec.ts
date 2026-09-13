import { Test, TestingModule } from '@nestjs/testing';
import { UnitsRepository } from './units.repository';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UnitsRepository - Tenant Isolation', () => {
  let repository: UnitsRepository;
  let prisma: jest.Mocked<Partial<PrismaService>>;

  beforeEach(async () => {
    prisma = { unit: { findUnique: jest.fn() } as any };
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnitsRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();
    repository = module.get<UnitsRepository>(UnitsRepository);
  });

  it('should throw NotFoundException on cross-tenant lookup', async () => {
    (prisma.unit.findUnique as jest.Mock).mockResolvedValue({ id: 'unit-1', organizationId: 'org-B' });
    await expect(repository.findByIdAndOrganization('org-A', 'unit-1')).rejects.toThrow(NotFoundException);
  });
});
