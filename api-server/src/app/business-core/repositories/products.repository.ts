import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, data: any) {
    const createData: any = { ...data };
    
    if (createData.categoryId) {
      createData.category = { connect: { id: createData.categoryId } };
      delete createData.categoryId;
    }
    
    if (createData.unitId) {
      createData.unit = { connect: { id: createData.unitId } };
      delete createData.unitId;
    }

    return this.prisma.product.create({
      data: {
        ...createData,
        organization: { connect: { id: organizationId } },
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.product.findMany({
      where: { organizationId },
      include: { category: true, unit: true },
    });
  }

  async findByIdAndOrganization(organizationId: string, id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, unit: true },
    });

    if (!product || product.organizationId !== organizationId) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(organizationId: string, id: string, data: Prisma.ProductUpdateInput) {
    await this.findByIdAndOrganization(organizationId, id);
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }
}
