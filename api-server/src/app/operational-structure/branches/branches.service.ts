import { Injectable } from '@nestjs/common';
import { BranchesRepository } from './branches.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class BranchesService {
  constructor(private readonly branchesRepository: BranchesRepository) {}

  async create(organizationId: string, data: Omit<Prisma.BranchCreateInput, 'organization' | 'journalLines' | 'warehouses'>) {
    return this.branchesRepository.create(organizationId, data);
  }

  async findAll(organizationId: string) {
    return this.branchesRepository.findAll(organizationId);
  }

  async findOne(organizationId: string, id: string) {
    return this.branchesRepository.findByIdAndOrganization(organizationId, id);
  }

  async update(organizationId: string, id: string, data: Prisma.BranchUpdateInput) {
    return this.branchesRepository.update(organizationId, id, data);
  }
}
