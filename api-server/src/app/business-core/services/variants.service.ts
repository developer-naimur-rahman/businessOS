import { Injectable, BadRequestException } from '@nestjs/common';
import { VariantsRepository } from '../repositories/variants.repository';
import { ProductsRepository } from '../repositories/products.repository';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class VariantsService {
  constructor(
    private readonly variantsRepository: VariantsRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(organizationId: string, data: any) {
    if (!data.productId) {
      throw new BadRequestException('productId is required');
    }
    
    if (data.sellingPrice !== undefined) {
      data.sellingPrice = new Decimal(data.sellingPrice);
    }
    if (data.costPrice !== undefined) {
      data.costPrice = new Decimal(data.costPrice);
    }

    // Atomic validation using interactive transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Product exists & belongs to org
      const product = await tx.product.findUnique({
        where: { organizationId_id: { organizationId, id: data.productId } },
      });
      if (!product) {
        throw new BadRequestException('Product not found or access denied');
      }

      // 2. SKU uniqueness in org
      if (data.sku) {
        const existingSku = await tx.productVariant.findFirst({
          where: { organizationId, sku: data.sku },
        });
        if (existingSku) {
          throw new BadRequestException(`SKU ${data.sku} is already in use.`);
        }
      }

      return tx.productVariant.create({
        data: { ...data, organizationId },
      });
    });
  }

  async findAll(organizationId: string, productId?: string) {
    return this.variantsRepository.findAll(organizationId, productId);
  }

  async findOne(organizationId: string, id: string) {
    return this.variantsRepository.findByIdAndOrganization(organizationId, id);
  }

  async update(organizationId: string, id: string, data: any) {
    if (data.sellingPrice !== undefined) {
      data.sellingPrice = new Decimal(data.sellingPrice);
    }
    if (data.costPrice !== undefined) {
      data.costPrice = new Decimal(data.costPrice);
    }

    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { organizationId_id: { organizationId, id } },
      });
      if (!variant) {
        throw new BadRequestException('Variant not found');
      }

      // SKU uniqueness in org
      if (data.sku && data.sku !== variant.sku) {
        const existingSku = await tx.productVariant.findFirst({
          where: { organizationId, sku: data.sku },
        });
        if (existingSku) {
          throw new BadRequestException(`SKU ${data.sku} is already in use.`);
        }
      }

      return tx.productVariant.update({
        where: { organizationId_id: { organizationId, id } },
        data,
      });
    });
  }

  async delete(organizationId: string, id: string) {
    return this.variantsRepository.delete(organizationId, id);
  }
}
