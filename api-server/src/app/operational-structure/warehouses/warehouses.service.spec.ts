import { Test, TestingModule } from '@nestjs/testing';
import { WarehousesService } from './warehouses.service';
import { WarehousesRepository } from './warehouses.repository';
import { BranchesRepository } from '../branches/branches.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('WarehousesService', () => {
  let service: WarehousesService;
  let warehousesRepo: jest.Mocked<WarehousesRepository>;
  let branchesRepo: jest.Mocked<BranchesRepository>;

  beforeEach(async () => {
    warehousesRepo = {
      create: jest.fn(),
      update: jest.fn(),
      runTransaction: jest.fn(),
    } as any;
    branchesRepo = {
      findByIdAndOrganization: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehousesService,
        { provide: WarehousesRepository, useValue: warehousesRepo },
        { provide: BranchesRepository, useValue: branchesRepo },
      ],
    }).compile();

    service = module.get<WarehousesService>(WarehousesService);
  });

  describe('create', () => {
    it('should reject if branch belongs to another organization', async () => {
      branchesRepo.findByIdAndOrganization.mockRejectedValue(new NotFoundException());
      await expect(service.create('org-A', { branchId: 'branch-org-B' }))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should reject if creating an inactive default warehouse', async () => {
      branchesRepo.findByIdAndOrganization.mockResolvedValue({} as any);
      await expect(service.create('org-A', { branchId: 'branch-A', isDefault: true, isActive: false }))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should run transaction for default warehouse', async () => {
      branchesRepo.findByIdAndOrganization.mockResolvedValue({} as any);
      const txMock = { warehouse: { updateMany: jest.fn(), create: jest.fn() } };
      warehousesRepo.runTransaction.mockImplementation(async (cb) => cb(txMock as any));

      await service.create('org-A', { branchId: 'branch-A', isDefault: true });
      expect(warehousesRepo.runTransaction).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should reject if updating to an inactive default warehouse', async () => {
      warehousesRepo.findByIdAndOrganization = jest.fn().mockResolvedValue({ branchId: 'branch-A', isActive: true, isDefault: false });
      await expect(service.update('org-A', 'wh-1', { isDefault: true, isActive: false }))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should run transaction for default warehouse on update', async () => {
      warehousesRepo.findByIdAndOrganization = jest.fn().mockResolvedValue({ branchId: 'branch-A', isActive: true, isDefault: false });
      const txMock = { warehouse: { updateMany: jest.fn(), update: jest.fn() } };
      warehousesRepo.runTransaction.mockImplementation(async (cb) => cb(txMock as any));

      await service.update('org-A', 'wh-1', { isDefault: true });
      expect(warehousesRepo.runTransaction).toHaveBeenCalled();
    });
  });
});
