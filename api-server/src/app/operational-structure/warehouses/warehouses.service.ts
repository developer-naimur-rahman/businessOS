import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { WarehousesRepository } from './warehouses.repository';
import { BranchesRepository } from '../branches/branches.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class WarehousesService {
  constructor(
    private readonly warehousesRepository: WarehousesRepository,
    private readonly branchesRepository: BranchesRepository,
  ) {}

  async create(organizationId: string, data: any) {
    // 1. Cross-tenant branch integrity check
    await this.branchesRepository.findByIdAndOrganization(organizationId, data.branchId);

    // 2. Inactive warehouse cannot become default
    if (data.isDefault && data.isActive === false) {
      throw new BadRequestException('An inactive warehouse cannot be set as the default');
    }

    // 3. Default warehouse atomic safety
    if (data.isDefault) {
      return this.warehousesRepository.runTransaction(async (tx) => {
        // Clear any existing default warehouse for this branch
        await tx.warehouse.updateMany({
          where: { organizationId, branchId: data.branchId, isDefault: true },
          data: { isDefault: false },
        });

        const createData: any = { ...data };
        delete createData.branchId;

        // Create the new default warehouse
        return tx.warehouse.create({
          data: {
            ...createData,
            organization: { connect: { id: organizationId } },
            branch: { connect: { id: data.branchId } },
          },
        });
      });
    }

    const createData: any = { ...data };
    const branchId = createData.branchId;
    delete createData.branchId;

    return this.warehousesRepository.create(organizationId, {
      ...createData,
      branch: { connect: { id: branchId } },
    });
  }

  async findAll(organizationId: string) {
    return this.warehousesRepository.findAll(organizationId);
  }

  async findAllByBranch(organizationId: string, branchId: string) {
    return this.warehousesRepository.findAllByBranch(organizationId, branchId);
  }

  async findOne(organizationId: string, id: string) {
    return this.warehousesRepository.findByIdAndOrganization(organizationId, id);
  }

  async update(organizationId: string, id: string, data: any) {
    const existing = await this.warehousesRepository.findByIdAndOrganization(organizationId, id);
    const targetBranchId = data.branchId || existing.branchId;

    if (data.branchId) {
      await this.branchesRepository.findByIdAndOrganization(organizationId, data.branchId);
    }

    const nextIsActive = data.isActive !== undefined ? data.isActive : existing.isActive;
    const nextIsDefault = data.isDefault !== undefined ? data.isDefault : existing.isDefault;

    if (nextIsDefault && nextIsActive === false) {
      throw new BadRequestException('An inactive warehouse cannot be set as the default');
    }

    if (data.isDefault) {
      return this.warehousesRepository.runTransaction(async (tx) => {
        // Clear existing default warehouse for the branch
        await tx.warehouse.updateMany({
          where: { organizationId, branchId: targetBranchId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });

        const updateData: any = { ...data };
        if (data.branchId) updateData.branch = { connect: { id: data.branchId } };
        delete updateData.branchId;

        return tx.warehouse.update({
          where: { id },
          data: updateData,
        });
      });
    }

    const updateData: any = { ...data };
    if (data.branchId) updateData.branch = { connect: { id: data.branchId } };
    delete updateData.branchId;

    return this.warehousesRepository.update(organizationId, id, updateData);
  }
}
