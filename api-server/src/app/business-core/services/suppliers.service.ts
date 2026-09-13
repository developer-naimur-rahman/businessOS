import { Injectable } from '@nestjs/common';
import { SuppliersRepository } from '../repositories/suppliers.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class SuppliersService {
  constructor(private readonly suppliersRepository: SuppliersRepository) {}

  async create(organizationId: string, data: Omit<Prisma.SupplierCreateInput, 'organization'>) {
    return this.suppliersRepository.create(organizationId, data);
  }

  async findAll(organizationId: string) {
    return this.suppliersRepository.findAll(organizationId);
  }

  async findOne(organizationId: string, id: string) {
    return this.suppliersRepository.findByIdAndOrganization(organizationId, id);
  }

  async update(organizationId: string, id: string, data: Prisma.SupplierUpdateInput) {
    return this.suppliersRepository.update(organizationId, id, data);
  }
}
