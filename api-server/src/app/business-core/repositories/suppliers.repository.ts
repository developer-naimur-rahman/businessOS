import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SuppliersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, data: Omit<Prisma.SupplierCreateInput, 'organization'>) {
    return this.prisma.supplier.create({
      data: {
        ...data,
        organization: { connect: { id: organizationId } },
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.supplier.findMany({
      where: { organizationId },
    });
  }

  async findByIdAndOrganization(organizationId: string, id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier || supplier.organizationId !== organizationId) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  async update(organizationId: string, id: string, data: Prisma.SupplierUpdateInput) {
    await this.findByIdAndOrganization(organizationId, id);
    return this.prisma.supplier.update({
      where: { id },
      data,
    });
  }
}
