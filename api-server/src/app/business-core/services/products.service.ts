import { Injectable, BadRequestException } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { CategoriesRepository } from '../repositories/categories.repository';
import { UnitsRepository } from '../repositories/units.repository';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesRepository: CategoriesRepository,
    private readonly unitsRepository: UnitsRepository,
  ) {}

  async create(organizationId: string, data: any) {
    if (data.sellingPrice !== undefined) {
      data.sellingPrice = new Decimal(data.sellingPrice);
      if (data.sellingPrice.isNegative()) throw new BadRequestException('Selling price cannot be negative');
    }
    if (data.costPrice !== undefined && data.costPrice !== null) {
      data.costPrice = new Decimal(data.costPrice);
      if (data.costPrice.isNegative()) throw new BadRequestException('Cost price cannot be negative');
    }

    if (data.categoryId) {
      await this.categoriesRepository.findByIdAndOrganization(organizationId, data.categoryId);
    }
    if (data.unitId) {
      await this.unitsRepository.findByIdAndOrganization(organizationId, data.unitId);
    }

    return this.productsRepository.create(organizationId, data);
  }

  async findAll(organizationId: string) {
    return this.productsRepository.findAll(organizationId);
  }

  async findOne(organizationId: string, id: string) {
    return this.productsRepository.findByIdAndOrganization(organizationId, id);
  }

  async update(organizationId: string, id: string, data: any) {
    if (data.sellingPrice !== undefined) {
      data.sellingPrice = new Decimal(data.sellingPrice);
      if (data.sellingPrice.isNegative()) throw new BadRequestException('Selling price cannot be negative');
    }
    if (data.costPrice !== undefined && data.costPrice !== null) {
      data.costPrice = new Decimal(data.costPrice);
      if (data.costPrice.isNegative()) throw new BadRequestException('Cost price cannot be negative');
    }
    
    if (data.categoryId) {
      await this.categoriesRepository.findByIdAndOrganization(organizationId, data.categoryId);
    }
    if (data.unitId) {
      await this.unitsRepository.findByIdAndOrganization(organizationId, data.unitId);
    }

    return this.productsRepository.update(organizationId, id, data);
  }
}
