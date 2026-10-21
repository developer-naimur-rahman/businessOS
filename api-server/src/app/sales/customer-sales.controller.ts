import { Controller, Get, Post, Body, Param, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CustomerJwtAuthGuard, OptionalCustomerJwtAuthGuard } from '../auth/guards/customer-jwt-auth.guard';
import { CreateCustomerCheckoutDto, TrackOrderDto } from './dto/sales.dto';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';
import { FinanceIntegrationService } from '../finance-integration/finance-integration.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('public/orders')
export class CustomerSalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly financeIntegrationService: FinanceIntegrationService
  ) {}

  private async getDefaultOrganizationId(): Promise<string> {
    const org = await prisma.organization.findFirst();
    if (!org) {
      throw new NotFoundException('Storefront organization not configured.');
    }
    return org.id;
  }

  @Post('checkout')
  @UseGuards(OptionalCustomerJwtAuthGuard, RateLimitGuard)
  @RateLimit({ limit: 15, ttlSeconds: 60 })
  async checkout(@Request() req, @Body() data: CreateCustomerCheckoutDto) {
    const orgId = await this.getDefaultOrganizationId();
    let customerId = req.user?.customerId;

    // Guest checkout auto-linking: find or create customer record
    if (!customerId) {
      const phone = data.customerPhone || data.customer?.phone || data.senderPhone;
      const name = data.customer?.name || (phone ? `Customer ${phone.slice(-4)}` : 'Storefront Guest');
      const email = data.customer?.email;

      if (phone) {
        let existingCustomer = await prisma.customer.findFirst({
          where: { organizationId: orgId, phone },
        });

        if (!existingCustomer) {
          existingCustomer = await prisma.customer.create({
            data: {
              organizationId: orgId,
              name,
              phone,
              email,
              address: data.shippingAddress || data.customer?.address,
            },
          });
        }
        customerId = existingCustomer.id;
      }
    }

    const sale = await this.salesService.createOnlineOrder(orgId, customerId, data);

    this.financeIntegrationService.processPendingOutboxEvents(orgId)
      .catch(err => console.error("Failed to process finance outbox events:", err));

    return {
      ...sale,
      invoiceNumber: sale.saleNumber,
      totalAmount: sale.total,
    };
  }

  @Post('track')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 30, ttlSeconds: 60 })
  async trackOrder(@Body() body: TrackOrderDto) {
    const orgId = await this.getDefaultOrganizationId();
    return this.salesService.trackOrder(orgId, body.identifier, body.phone);
  }

  @Get()
  @UseGuards(CustomerJwtAuthGuard)
  async getMyOrders(@Request() req) {
    const orgId = await this.getDefaultOrganizationId();
    const customerId = req.user.customerId;

    const orders = await prisma.sale.findMany({
      where: {
        organizationId: orgId,
        customerId,
      },
      include: {
        lines: {
          include: { variant: { include: { product: true } } },
        },
        payments: true,
      },
      orderBy: { saleDate: 'desc' },
    });

    return orders.map(order => ({
      ...order,
      invoiceNumber: order.saleNumber,
      totalAmount: order.total,
    }));
  }

  @Get(':id')
  @UseGuards(CustomerJwtAuthGuard)
  async getOrderById(@Request() req, @Param('id') id: string) {
    const orgId = await this.getDefaultOrganizationId();
    const customerId = req.user.customerId;

    const order = await prisma.sale.findFirst({
      where: {
        id,
        organizationId: orgId,
        customerId,
      },
      include: {
        lines: {
          include: { variant: { include: { product: true } } },
        },
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      ...order,
      invoiceNumber: order.saleNumber,
      totalAmount: order.total,
    };
  }

  @Get(':id/track')
  @UseGuards(CustomerJwtAuthGuard)
  async trackMyOrder(@Request() req, @Param('id') id: string) {
    const orgId = await this.getDefaultOrganizationId();
    return this.salesService.trackOrder(orgId, id, undefined, req.user.customerId);
  }
}
