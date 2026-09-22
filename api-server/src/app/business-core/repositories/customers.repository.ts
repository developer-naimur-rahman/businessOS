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
      include: {
        sales: {
          orderBy: { saleDate: 'desc' },
          include: { 
            payments: true,
            lines: {
              include: {
                variant: {
                  include: {
                    product: true
                  }
                }
              }
            }
          }
        }
      }
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

  async getLedger(organizationId: string, customerId: string) {
    const sales = await this.prisma.sale.findMany({
      where: {
        organizationId,
        customerId,
        status: 'COMPLETED',
      },
      select: {
        id: true,
        saleNumber: true,
        saleDate: true,
        total: true,
      },
    });

    const saleIds = sales.map((s) => s.id);

    const payments = await this.prisma.salePayment.findMany({
      where: {
        organizationId,
        saleId: { in: saleIds },
      },
      select: {
        id: true,
        saleId: true,
        amount: true,
        paymentDate: true,
        reference: true,
        method: true,
      },
    });

    return { sales, payments };
  }
}
