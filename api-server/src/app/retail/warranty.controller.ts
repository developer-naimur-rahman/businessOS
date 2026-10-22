import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { WarrantyService, RegisterWarrantyDto, ClaimWarrantyDto } from './warranty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('admin/warranty')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class WarrantyController {
  constructor(private readonly warrantyService: WarrantyService) {}

  @Post('register')
  @RequirePermissions('products.manage')
  async registerWarranty(@Request() req: any, @Body() body: RegisterWarrantyDto) {
    return this.warrantyService.registerWarranty(req.user.organizationId, req.user.id || null, body);
  }

  @Get('verify/:query')
  @RequirePermissions('products.view')
  async verifyWarranty(@Request() req: any, @Param('query') query: string) {
    return this.warrantyService.verifyWarranty(req.user.organizationId, query);
  }

  @Get('lookup')
  @RequirePermissions('products.view')
  async listWarranties(@Request() req: any, @Query('search') search?: string) {
    return this.warrantyService.listWarranties(req.user.organizationId, search);
  }

  @Post('claim')
  @RequirePermissions('products.manage')
  async logClaim(@Request() req: any, @Body() body: ClaimWarrantyDto) {
    return this.warrantyService.logClaim(req.user.organizationId, req.user.id || null, body);
  }
}
