import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Request, UseGuards } from '@nestjs/common';
import { MediaService } from '../services/media.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../iam/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly service: MediaService) {}

  @Post()
  @RequirePermissions('catalog.manage')
  create(@Request() req, @Body() data: any) {
    return this.service.create(req.user.organizationId, data);
  }

  @Get()
  @RequirePermissions('catalog.view')
  findByProduct(@Request() req, @Query('productId') productId: string) {
    return this.service.findByProduct(req.user.organizationId, productId);
  }

  @Patch(':id/primary')
  @RequirePermissions('catalog.manage')
  setPrimary(@Request() req, @Param('id') id: string, @Body('productId') productId: string) {
    return this.service.setPrimary(req.user.organizationId, productId, id);
  }

  @Delete(':id')
  @RequirePermissions('catalog.manage')
  delete(@Request() req, @Param('id') id: string) {
    return this.service.delete(req.user.organizationId, id);
  }
}
