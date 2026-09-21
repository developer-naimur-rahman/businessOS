import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { VariantsService } from '../services/variants.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../iam/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
@Controller('variants')
export class VariantsController {
  constructor(private readonly service: VariantsService) {}

  @Post()
  @RequirePermissions('catalog.manage')
  create(@Request() req, @Body() data: any) {
    return this.service.create(req.user.organizationId, data);
  }

  @Get()
  @RequirePermissions('catalog.view')
  findAll(@Request() req, @Query('productId') productId?: string) {
    return this.service.findAll(req.user.organizationId, productId);
  }

  @Get(':id')
  @RequirePermissions('catalog.view')
  findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(req.user.organizationId, id);
  }

  @Patch(':id')
  @RequirePermissions('catalog.manage')
  update(@Request() req, @Param('id') id: string, @Body() data: Prisma.ProductVariantUpdateInput) {
    return this.service.update(req.user.organizationId, id, data);
  }

  @Delete(':id')
  @RequirePermissions('catalog.manage')
  remove(@Request() req, @Param('id') id: string) {
    return this.service.delete(req.user.organizationId, id);
  }
}
