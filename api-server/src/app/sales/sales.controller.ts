import { Controller, Get, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { SalesService, CreateSaleDto } from './sales.service';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';

@Controller('sales')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

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
    return this.salesService.createDirectSale(req.user.organizationId, data, req.user.id);
  }
}
