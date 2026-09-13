import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from '../repositories/categories.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async create(organizationId: string, data: Omit<Prisma.CategoryCreateInput, 'organization'>) {
    if (data.parent && data.parent.connect && data.parent.connect.id) {
       await this.categoriesRepository.findByIdAndOrganization(organizationId, data.parent.connect.id);
    }
    return this.categoriesRepository.create(organizationId, data);
  }

  async findAll(organizationId: string) {
    return this.categoriesRepository.findAll(organizationId);
  }

  async findOne(organizationId: string, id: string) {
    return this.categoriesRepository.findByIdAndOrganization(organizationId, id);
  }

  async update(organizationId: string, id: string, data: Prisma.CategoryUpdateInput) {
    if (data.parent && data.parent.connect && data.parent.connect.id) {
       await this.categoriesRepository.findByIdAndOrganization(organizationId, data.parent.connect.id as string);
    }
    return this.categoriesRepository.update(organizationId, id, data);
  }
}
