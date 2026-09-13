import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UnitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, data: Omit<Prisma.UnitCreateInput, 'organization'>) {
    return this.prisma.unit.create({
      data: {
        ...data,
        organization: { connect: { id: organizationId } },
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.unit.findMany({
      where: { organizationId },
    });
  }

  async findByIdAndOrganization(organizationId: string, id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
    });

    if (!unit || unit.organizationId !== organizationId) {
      throw new NotFoundException('Unit not found');
    }

    return unit;
  }

  async update(organizationId: string, id: string, data: Prisma.UnitUpdateInput) {
    await this.findByIdAndOrganization(organizationId, id);
    return this.prisma.unit.update({
      where: { id },
      data,
    });
  }
}
