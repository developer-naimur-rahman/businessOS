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
    if (data.supplierCost !== undefined && data.supplierCost !== null) {
      data.supplierCost = new Decimal(data.supplierCost);
      if (data.supplierCost.isNegative()) throw new BadRequestException('Supplier cost cannot be negative');
    }
    if (data.estimatedShippingCost !== undefined && data.estimatedShippingCost !== null) {
      data.estimatedShippingCost = new Decimal(data.estimatedShippingCost);
      if (data.estimatedShippingCost.isNegative()) throw new BadRequestException('Estimated shipping cost cannot be negative');
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
    if (data.supplierCost !== undefined && data.supplierCost !== null) {
      data.supplierCost = new Decimal(data.supplierCost);
      if (data.supplierCost.isNegative()) throw new BadRequestException('Supplier cost cannot be negative');
    }
    if (data.estimatedShippingCost !== undefined && data.estimatedShippingCost !== null) {
      data.estimatedShippingCost = new Decimal(data.estimatedShippingCost);
      if (data.estimatedShippingCost.isNegative()) throw new BadRequestException('Estimated shipping cost cannot be negative');
    }
    
    if (data.categoryId) {
      await this.categoriesRepository.findByIdAndOrganization(organizationId, data.categoryId);
    }
    if (data.unitId) {
      await this.unitsRepository.findByIdAndOrganization(organizationId, data.unitId);
    }

    return this.productsRepository.update(organizationId, id, data);
  }

  analyzeProfit(data: {
    sellingPrice: number;
    supplierCost: number;
    estimatedShippingCost?: number;
    gatewayFeePercentage?: number;
  }) {
    const sellingPrice = Number(data.sellingPrice) || 0;
    const supplierCost = Number(data.supplierCost) || 0;
    const estimatedShippingCost = Number(data.estimatedShippingCost) || 0;
    const gatewayFeePercentage = data.gatewayFeePercentage !== undefined ? Number(data.gatewayFeePercentage) : 1.5;

    if (sellingPrice < 0) throw new BadRequestException('Selling price cannot be negative');
    if (supplierCost < 0) throw new BadRequestException('Supplier cost cannot be negative');
    if (estimatedShippingCost < 0) throw new BadRequestException('Estimated shipping cost cannot be negative');
    if (gatewayFeePercentage < 0 || gatewayFeePercentage >= 100) {
      throw new BadRequestException('Gateway fee percentage must be between 0 and 100');
    }

    const gatewayFeeRate = gatewayFeePercentage / 100;
    const totalSourcingCost = supplierCost + estimatedShippingCost;
    const gatewayFeeAmount = Number((sellingPrice * gatewayFeeRate).toFixed(2));
    const totalCost = Number((totalSourcingCost + gatewayFeeAmount).toFixed(2));
    const netProfit = Number((sellingPrice - totalCost).toFixed(2));
    const profitMargin = sellingPrice > 0 ? Number(((netProfit / sellingPrice) * 100).toFixed(2)) : 0;

    // Break-even selling price: Price where net profit is 0
    const breakEvenSellingPrice = gatewayFeeRate < 1 
      ? Number((totalSourcingCost / (1 - gatewayFeeRate)).toFixed(2))
      : totalSourcingCost;

    // Recommended Safe Selling Price with target 35% margin
    const targetMargin = 0.35;
    const recommendedSellingPrice = (1 - gatewayFeeRate - targetMargin) > 0
      ? Number((totalSourcingCost / (1 - gatewayFeeRate - targetMargin)).toFixed(2))
      : Number((totalSourcingCost * 1.5).toFixed(2));

    return {
      sellingPrice,
      supplierCost,
      estimatedShippingCost,
      totalSourcingCost,
      gatewayFeePercentage,
      gatewayFeeAmount,
      totalCost,
      netProfit,
      profitMargin,
      breakEvenSellingPrice,
      breakEvenPrice: breakEvenSellingPrice,
      recommendedSellingPrice,
      recommendedPrice: recommendedSellingPrice,
      targetMarginPercentage: 35,
    };
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
