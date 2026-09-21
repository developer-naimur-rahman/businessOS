import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AttributesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAttribute(organizationId: string, name: string) {
    return this.prisma.attribute.create({
      data: { name, organizationId }
    });
  }

  async createAttributeValue(organizationId: string, attributeId: string, value: string) {
    return this.prisma.attributeValue.create({
      data: { value, attributeId, organizationId }
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.attribute.findMany({
      where: { organizationId },
      include: { values: true },
    });
  }

  async findAttributeByName(organizationId: string, name: string) {
    return this.prisma.attribute.findFirst({
      where: { organizationId, name: { equals: name, mode: 'insensitive' } }
    });
  }

  async findAttributeValueByValue(organizationId: string, attributeId: string, value: string) {
    return this.prisma.attributeValue.findFirst({
      where: { organizationId, attributeId, value: { equals: value, mode: 'insensitive' } }
    });
  }
}
