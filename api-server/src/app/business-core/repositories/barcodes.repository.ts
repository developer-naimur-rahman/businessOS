import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class BarcodesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, variantId: string, barcode: string) {
    return this.prisma.productVariantBarcode.create({
      data: {
        organizationId,
        variantId,
        barcode,
      }
    });
  }

  async findByBarcode(organizationId: string, barcode: string) {
    return this.prisma.productVariantBarcode.findUnique({
      where: { organizationId_barcode: { organizationId, barcode } },
      include: { variant: { include: { product: true } } }
    });
  }

  async setStatus(organizationId: string, barcode: string, isActive: boolean) {
    return this.prisma.productVariantBarcode.update({
      where: { organizationId_barcode: { organizationId, barcode } },
      data: { isActive }
    });
  }

  async delete(organizationId: string, barcode: string) {
    return this.prisma.productVariantBarcode.delete({
      where: { organizationId_barcode: { organizationId, barcode } }
    });
  }
}
