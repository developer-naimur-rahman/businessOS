import { Controller, Get, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { SalesService, CreateSaleDto, AddSalePaymentDto } from './sales.service';
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
  async getSales(@Request() req) {
    return this.salesService.getSales(req.user.organizationId);
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
}
