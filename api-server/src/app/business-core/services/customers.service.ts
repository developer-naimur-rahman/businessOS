import { Injectable } from '@nestjs/common';
import { CustomersRepository } from '../repositories/customers.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async create(organizationId: string, data: Omit<Prisma.CustomerCreateInput, 'organization'>) {
    return this.customersRepository.create(organizationId, data);
  }

  async findAll(organizationId: string) {
    return this.customersRepository.findAll(organizationId);
  }

  async findOne(organizationId: string, id: string) {
    return this.customersRepository.findByIdAndOrganization(organizationId, id);
  }

  async update(organizationId: string, id: string, data: Prisma.CustomerUpdateInput) {
    return this.customersRepository.update(organizationId, id, data);
  }
}
