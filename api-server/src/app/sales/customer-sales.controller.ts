import { Controller, Get, Post, Body, Param, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CustomerJwtAuthGuard } from '../auth/guards/customer-jwt-auth.guard';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import { FinanceIntegrationService } from '../finance-integration/finance-integration.service';

@Controller('public/orders')
@UseGuards(CustomerJwtAuthGuard)
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
  async checkout(@Request() req, @Body() data: any) {
    const orgId = await this.getDefaultOrganizationId();
    const customerId = req.user.customerId;
    
    // Fallback branch/warehouse for online orders
    // In a real system, this would be derived from e-commerce settings
    const branch = await prisma.branch.findFirst({ where: { organizationId: orgId }});
    const warehouse = await prisma.warehouse.findFirst({ where: { organizationId: orgId, branchId: branch?.id }});
    
    if (!branch || !warehouse) {
      throw new Error('Storefront not fully configured (missing branch/warehouse)');
    }

    const saleData = {
      customerId,
      branchId: branch.id,
      warehouseId: warehouse.id,
      lines: data.lines ? data.lines.map((line: any) => ({
        productId: line.productId,
        quantity: line.quantity,
        discount: line.discount || 0,
      })) : [],
      payments: data.payments || [],
    };

    const sale = await this.salesService.createDirectSale(orgId, saleData as any, null);
    
    this.financeIntegrationService.processPendingOutboxEvents(orgId)
      .catch(err => console.error("Failed to process finance outbox events:", err));
      
    return sale;
  }

  @Get()
  async getMyOrders(@Request() req) {
    const orgId = await this.getDefaultOrganizationId();
    const customerId = req.user.customerId;
    
    const orders = await prisma.sale.findMany({
      where: {
        organizationId: orgId,
        customerId
      },
      include: {
        lines: {
          include: { product: true }
        },
        payments: true
      },
      orderBy: { saleDate: 'desc' }
    });
    
    return orders;
  }

  @Get(':id')
  async getOrderById(@Request() req, @Param('id') id: string) {
    const orgId = await this.getDefaultOrganizationId();
    const customerId = req.user.customerId;
    
    const order = await prisma.sale.findFirst({
      where: {
        id,
        organizationId: orgId,
        customerId
      },
      include: {
        lines: {
          include: { product: true }
        },
        payments: true
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    
    return order;
  }
}
