import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BranchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, data: Omit<Prisma.BranchCreateInput, 'organization' | 'journalLines' | 'warehouses'>) {
    return this.prisma.branch.create({
      data: {
        ...data,
        organization: { connect: { id: organizationId } },
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.branch.findMany({
      where: { organizationId },
    });
  }

  async findByIdAndOrganization(organizationId: string, id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
    });

    if (!branch || branch.organizationId !== organizationId) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  async update(organizationId: string, id: string, data: Prisma.BranchUpdateInput) {
    await this.findByIdAndOrganization(organizationId, id);
    return this.prisma.branch.update({
      where: { id },
      data,
    });
  }
}
