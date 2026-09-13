import { Test, TestingModule } from '@nestjs/testing';
import { BranchesService } from './branches.service';
import { BranchesRepository } from './branches.repository';
import { NotFoundException } from '@nestjs/common';

describe('BranchesService', () => {
  let service: BranchesService;
  let branchesRepo: jest.Mocked<BranchesRepository>;

  beforeEach(async () => {
    branchesRepo = {
      create: jest.fn(),
      update: jest.fn(),
      findByIdAndOrganization: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        { provide: BranchesRepository, useValue: branchesRepo },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
  });

  describe('findOne', () => {
    it('should throw NotFoundException on cross-tenant branch lookup', async () => {
      branchesRepo.findByIdAndOrganization.mockRejectedValue(new NotFoundException());
      await expect(service.findOne('org-A', 'branch-org-B'))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should return branch if tenant matches', async () => {
      branchesRepo.findByIdAndOrganization.mockResolvedValue({ id: 'branch-A' } as any);
      const res = await service.findOne('org-A', 'branch-A');
      expect(res).toEqual({ id: 'branch-A' });
    });
  });
});
