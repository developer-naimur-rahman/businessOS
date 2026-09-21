import { Injectable, BadRequestException } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { CategoriesRepository } from '../repositories/categories.repository';
import { UnitsRepository } from '../repositories/units.repository';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { BulkProductOperationDto, BulkProductAction } from '../dto/bulk-product.dto';

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

  async findAll(organizationId: string, filterDto: any) {
    return this.productsRepository.findAll(organizationId, filterDto);
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

  async archive(organizationId: string, id: string) {
    // Soft archive: set status to ARCHIVED, online/POS visibility to false.
    // The repository checks for existence.
    return this.productsRepository.update(organizationId, id, {
      status: 'ARCHIVED',
      isOnlineVisible: false,
      isPosVisible: false,
    });
  }

  async bulkOperation(organizationId: string, dto: BulkProductOperationDto) {
    const results = [];
    for (const id of dto.productIds) {
      try {
        let updateData: Prisma.ProductUpdateInput = {};
        switch (dto.action) {
          case BulkProductAction.ACTIVATE:
            updateData = { status: 'ACTIVE' };
            break;
          case BulkProductAction.DEACTIVATE:
            updateData = { status: 'INACTIVE' };
            break;
          case BulkProductAction.ARCHIVE:
            updateData = { status: 'ARCHIVED', isOnlineVisible: false, isPosVisible: false };
            break;
          case BulkProductAction.SET_ONLINE_VISIBLE:
            updateData = { isOnlineVisible: true };
            break;
          case BulkProductAction.SET_ONLINE_HIDDEN:
            updateData = { isOnlineVisible: false };
            break;
          case BulkProductAction.SET_POS_VISIBLE:
            updateData = { isPosVisible: true };
            break;
          case BulkProductAction.SET_POS_HIDDEN:
            updateData = { isPosVisible: false };
            break;
        }
        await this.productsRepository.update(organizationId, id, updateData);
        results.push({ id, success: true });
      } catch (error: any) {
        results.push({ id, success: false, error: error.message });
      }
    }
    return results;
  }
}
