import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { SalesService, CreateSaleDto, AddSalePaymentDto } from './sales.service';
import { QuerySalesDto, UpdateOrderStatusDto } from './dto/sales.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { FinanceIntegrationService } from '../finance-integration/finance-integration.service';

@Controller('sales')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly financeIntegrationService: FinanceIntegrationService
  ) {}

  @Get()
  @RequirePermissions('sales.view')
  async getSales(@Request() req, @Query() query: QuerySalesDto) {
    return this.salesService.getOrders(req.user.organizationId, query);
  }

  @Get('orders')
  @RequirePermissions('sales.view')
  async getOrders(@Request() req, @Query() query: QuerySalesDto) {
    return this.salesService.getOrders(req.user.organizationId, query);
  }

  @Get('orders/:id')
  @RequirePermissions('sales.view')
  async getOrderDetails(@Request() req, @Param('id') id: string) {
    return this.salesService.getOrderDetailsWithAudit(req.user.organizationId, id);
  }

  @Patch('orders/:id/status')
  @RequirePermissions('sales.create')
  async updateOrderStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: UpdateOrderStatusDto,
  ) {
    const updated = await this.salesService.updateOrderStatus(
      req.user.organizationId,
      id,
      body,
      req.user.id,
    );

    this.financeIntegrationService.processPendingOutboxEvents(req.user.organizationId)
      .catch(err => console.error("Failed to process finance outbox events:", err));

    return updated;
  }

  @Patch('orders/:id/verify-payment')
  @RequirePermissions('sales.create')
  async verifyPayment(@Request() req, @Param('id') id: string) {
    const verified = await this.salesService.verifyPayment(
      req.user.organizationId,
      id,
      req.user.id,
    );

    this.financeIntegrationService.processPendingOutboxEvents(req.user.organizationId)
      .catch(err => console.error("Failed to process finance outbox events:", err));

    return verified;
  }

  @Get(':id')
  @RequirePermissions('sales.view')
  async getSaleById(@Request() req, @Param('id') id: string) {
    return this.salesService.getSaleById(req.user.organizationId, id);
  }

  @Post('complete-direct')
  @RequirePermissions('sales.create')
  async createDirectSale(@Request() req, @Body() data: CreateSaleDto) {
    const sale = await this.salesService.createDirectSale(req.user.organizationId, data, req.user.id);
    
    // Trigger async processing of finance outbox events
    this.financeIntegrationService.processPendingOutboxEvents(req.user.organizationId)
      .catch(err => console.error("Failed to process finance outbox events:", err));

    return sale;
  }

  @Post(':id/payments')
  @RequirePermissions('sales.create')
  async addPayment(@Request() req, @Param('id') id: string, @Body() data: AddSalePaymentDto) {
    const payment = await this.salesService.addPayment(req.user.organizationId, id, data);
    
    // Trigger async processing of finance outbox events
    this.financeIntegrationService.processPendingOutboxEvents(req.user.organizationId)
      .catch(err => console.error("Failed to process finance outbox events:", err));

    return payment;
  }

  @Post('hold-orders')
  @RequirePermissions('sales.create')
  async holdCart(@Request() req, @Body() data: any) {
    return this.salesService.holdCart(req.user.organizationId, req.user.id || null, data);
  }

  @Get('hold-orders')
  @RequirePermissions('sales.view')
  async getHeldCarts(@Request() req) {
    return this.salesService.getHeldCarts(req.user.organizationId);
  }

  @Delete('hold-orders/:id')
  @RequirePermissions('sales.create')
  async deleteHeldCart(@Request() req, @Param('id') id: string) {
    return this.salesService.deleteHeldCart(req.user.organizationId, id);
  }
}

