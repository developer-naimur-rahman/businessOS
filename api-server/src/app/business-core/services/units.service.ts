import { Injectable } from '@nestjs/common';
import { UnitsRepository } from '../repositories/units.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class UnitsService {
  constructor(private readonly unitsRepository: UnitsRepository) {}

  async create(organizationId: string, data: Omit<Prisma.UnitCreateInput, 'organization'>) {
    return this.unitsRepository.create(organizationId, data);
  }

  async findAll(organizationId: string) {
    return this.unitsRepository.findAll(organizationId);
  }

  async findOne(organizationId: string, id: string) {
    return this.unitsRepository.findByIdAndOrganization(organizationId, id);
  }

  async update(organizationId: string, id: string, data: Prisma.UnitUpdateInput) {
    return this.unitsRepository.update(organizationId, id, data);
  }
}
