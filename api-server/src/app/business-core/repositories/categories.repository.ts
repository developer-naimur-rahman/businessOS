import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, data: Omit<Prisma.CategoryCreateInput, 'organization'>) {
    return this.prisma.category.create({
      data: {
        ...data,
        organization: { connect: { id: organizationId } },
      },
    });
  }

  async findAll(organizationId: string, type?: Prisma.ProductType) {
    return this.prisma.category.findMany({
      where: { 
        organizationId,
        ...(type ? { type } : {})
      },
    });
  }

  async findByIdAndOrganization(organizationId: string, id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category || category.organizationId !== organizationId) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(organizationId: string, id: string, data: Prisma.CategoryUpdateInput) {
    await this.findByIdAndOrganization(organizationId, id);
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }
}
