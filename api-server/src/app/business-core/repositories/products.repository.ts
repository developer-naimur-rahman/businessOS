import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, data: import("../dto/create-product.dto").CreateProductDto) {
    const { variants, attributes, media, ...rest } = data as any;
    const productData: any = { ...rest };
    
    if (productData.categoryId) {
      productData.category = { connect: { organizationId_id: { organizationId, id: productData.categoryId } } };
      delete productData.categoryId;
    }
    
    if (productData.unitId) {
      productData.unit = { connect: { organizationId_id: { organizationId, id: productData.unitId } } };
      delete productData.unitId;
    }

    // Default variant fallback
    const initialVariants = variants?.length ? variants : [{
      organizationId,
      sku: productData.code ? `SKU-${productData.code}` : `VAR-${Date.now()}`,
      retailPrice: productData.sellingPrice || 0
    }];

    return this.prisma.product.create({
      data: {
        ...productData,
        organization: { connect: { id: organizationId } },
        variants: {
          create: initialVariants.map((v: any) => {
            const { organizationId, ...variantData } = v;
            return variantData;
          })
        }
      },
      include: {
        variants: true
      }
    });
  }

  async findAll(organizationId: string, filterDto: import("../dto/filter-product.dto").FilterProductDto) {
    const { page = 1, pageSize = 25, search, sortBy, sortOrder = 'asc', categoryId, type, status, isOnlineVisible, isPosVisible } = filterDto;
    
    const where: Prisma.ProductWhereInput = {
      organizationId,
      ...(categoryId && { categoryId }),
      ...(type && { type }),
      ...(status && { status }),
      ...(isOnlineVisible !== undefined && { isOnlineVisible }),
      ...(isPosVisible !== undefined && { isPosVisible }),
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } },
        { variants: { some: { barcodes: { some: { barcode: { contains: search, mode: 'insensitive' } } } } } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (sortBy) {
      if (['name', 'code', 'status', 'type', 'createdAt'].includes(sortBy)) {
        orderBy[sortBy] = sortOrder;
      }
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { 
          category: true, 
          unit: true,
          variants: true,
          media: {
            where: { isPrimary: true },
            take: 1
          }
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return new PaginatedResponseDto(items, total, page, pageSize);
  }

  async findByIdAndOrganization(organizationId: string, id: string) {
    const product = await this.prisma.product.findUnique({
      where: { organizationId_id: { organizationId, id } },
      include: { 
        category: true, 
        unit: true,
        media: {
          orderBy: { displayOrder: 'asc' }
        },
        variants: {
          include: {
            attributes: {
              include: {
                attributeValue: {
                  include: {
                    attribute: true
                  }
                }
              }
            },
            barcodes: true
          }
        }
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(organizationId: string, id: string, data: any) {
    await this.findByIdAndOrganization(organizationId, id);

    let updateData = { ...data };
    
    if (updateData.variants && Array.isArray(updateData.variants)) {
      const variants = updateData.variants;
      delete updateData.variants;
      
      updateData.variants = {
        deleteMany: {
          id: { notIn: variants.filter((v: any) => v.id).map((v: any) => v.id) }
        },
        upsert: variants.map((v: any) => {
          const { id: variantId, ...variantData } = v;
          return {
            where: { id: variantId || 'new-variant' },
            create: { ...variantData, organizationId },
            update: variantData
          };
        })
      };
    }

    return this.prisma.product.update({
      where: { organizationId_id: { organizationId, id } },
      data: updateData as Prisma.ProductUpdateInput,
      include: { variants: true }
    });
  }
}
