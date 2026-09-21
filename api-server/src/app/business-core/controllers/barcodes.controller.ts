import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { BarcodesService } from '../services/barcodes.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../iam/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
@Controller('barcodes')
export class BarcodesController {
  constructor(private readonly service: BarcodesService) {}

  @Post()
  @RequirePermissions('catalog.manage')
  create(@Request() req, @Body() data: { variantId: string, barcode: string }) {
    return this.service.create(req.user.organizationId, data.variantId, data.barcode);
  }

  @Get(':barcode')
  @RequirePermissions('catalog.view')
  lookup(@Request() req, @Param('barcode') barcode: string) {
    return this.service.lookup(req.user.organizationId, barcode);
  }

  @Patch(':barcode/status')
  @RequirePermissions('catalog.manage')
  setStatus(@Request() req, @Param('barcode') barcode: string, @Body('isActive') isActive: boolean) {
    return this.service.setStatus(req.user.organizationId, barcode, isActive);
  }

  @Delete(':barcode')
  @RequirePermissions('catalog.manage')
  delete(@Request() req, @Param('barcode') barcode: string) {
    return this.service.delete(req.user.organizationId, barcode);
  }
}
