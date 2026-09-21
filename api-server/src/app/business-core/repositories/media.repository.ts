import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, data: any) {
    return this.prisma.productMedia.create({
      data: { ...data, organizationId }
    });
  }

  async findByProduct(organizationId: string, productId: string) {
    return this.prisma.productMedia.findMany({
      where: { organizationId, productId },
      orderBy: { displayOrder: 'asc' }
    });
  }

  async setPrimary(organizationId: string, productId: string, mediaId: string) {
    await this.prisma.productMedia.updateMany({
      where: { organizationId, productId },
      data: { isPrimary: false }
    });
    return this.prisma.productMedia.update({
      where: { id: mediaId },
      data: { isPrimary: true }
    });
  }

  async delete(organizationId: string, id: string) {
    return this.prisma.productMedia.deleteMany({
      where: { organizationId, id }
    });
  }
}
