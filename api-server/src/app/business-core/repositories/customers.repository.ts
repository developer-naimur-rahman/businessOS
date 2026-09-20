import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, data: Omit<Prisma.CustomerCreateInput, 'organization'>) {
    return this.prisma.customer.create({
      data: {
        ...data,
        organization: { connect: { id: organizationId } },
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.customer.findMany({
      where: { organizationId },
    });
  }

  async findByIdAndOrganization(organizationId: string, id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer || customer.organizationId !== organizationId) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(organizationId: string, id: string, data: Prisma.CustomerUpdateInput) {
    await this.findByIdAndOrganization(organizationId, id);
    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async findByEmail(organizationId: string, email: string) {
    return this.prisma.customer.findFirst({
      where: {
        organizationId,
        email,
      },
    });
  }
}
