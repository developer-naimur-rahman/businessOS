import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WarehousesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, data: Omit<Prisma.WarehouseCreateInput, 'organization'>) {
    return this.prisma.warehouse.create({
      data: {
        ...data,
        organization: { connect: { id: organizationId } },
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.warehouse.findMany({
      where: { organizationId },
    });
  }

  async findAllByBranch(organizationId: string, branchId: string) {
    return this.prisma.warehouse.findMany({
      where: { organizationId, branchId },
    });
  }

  async findByIdAndOrganization(organizationId: string, id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
    });

    if (!warehouse || warehouse.organizationId !== organizationId) {
      throw new NotFoundException('Warehouse not found');
    }

    return warehouse;
  }

  async update(organizationId: string, id: string, data: Prisma.WarehouseUpdateInput) {
    await this.findByIdAndOrganization(organizationId, id);
    return this.prisma.warehouse.update({
      where: { id },
      data,
    });
  }

  async runTransaction<T>(fn: (prisma: any) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }
}
