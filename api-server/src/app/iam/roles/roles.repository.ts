import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, data: any) {
    return this.prisma.role.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description,
      },
    });
  }

  async findByIdAndOrganization(organizationId: string, id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role || role.organizationId !== organizationId) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async list(organizationId: string) {
    return this.prisma.role.findMany({
      where: { organizationId },
    });
  }
}
