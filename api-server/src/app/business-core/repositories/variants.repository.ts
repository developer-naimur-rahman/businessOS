import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class VariantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, data: Prisma.ProductVariantUncheckedCreateInput) {
    return this.prisma.productVariant.create({
      data: { ...data, organizationId },
    });
  }

  async findAll(organizationId: string, productId?: string) {
    const where: any = { organizationId };
    if (productId) where.productId = productId;
    return this.prisma.productVariant.findMany({ where });
  }

  async findByIdAndOrganization(organizationId: string, id: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { organizationId_id: { organizationId, id } },
      include: { attributes: { include: { attributeValue: true } }, barcodes: true },
    });
    if (!variant) throw new NotFoundException('Variant not found');
    return variant;
  }

  async update(organizationId: string, id: string, data: Prisma.ProductVariantUpdateInput) {
    await this.findByIdAndOrganization(organizationId, id);
    return this.prisma.productVariant.update({
      where: { organizationId_id: { organizationId, id } },
      data,
    });
  }

  async delete(organizationId: string, id: string) {
    await this.findByIdAndOrganization(organizationId, id);
    return this.prisma.productVariant.update({
      where: { organizationId_id: { organizationId, id } },
      data: { status: 'ARCHIVED' },
    });
  }
}
