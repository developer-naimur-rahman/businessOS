import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { QuotationsService, CreateQuotationDto } from './quotations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('admin/quotations')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  @RequirePermissions('sales.manage')
  async createQuotation(@Request() req: any, @Body() body: CreateQuotationDto) {
    return this.quotationsService.createQuotation(req.user.organizationId, req.user.id || null, body);
  }

  @Get()
  @RequirePermissions('sales.view')
  async getQuotations(@Request() req: any, @Query('status') status?: string) {
    return this.quotationsService.getQuotations(req.user.organizationId, status);
  }

  @Post(':id/convert-to-sale')
  @RequirePermissions('sales.manage')
  async convertToSale(@Request() req: any, @Param('id') id: string) {
    return this.quotationsService.convertToSale(req.user.organizationId, req.user.id || null, id);
  }
}
