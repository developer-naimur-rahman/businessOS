import { Controller, Get, Post, Put, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../iam/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('operational-structure/warehouses')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @RequirePermissions('operational.warehouses.manage')
  async create(@Request() req, @Body() body: any) {
    return this.warehousesService.create(req.user.organizationId, body);
  }

  @Get()
  @RequirePermissions('operational.warehouses.view')
  async findAll(@Request() req, @Query('branchId') branchId?: string) {
    if (branchId) {
      return this.warehousesService.findAllByBranch(req.user.organizationId, branchId);
    }
    return this.warehousesService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @RequirePermissions('operational.warehouses.view')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.warehousesService.findOne(req.user.organizationId, id);
  }

  @Put(':id')
  @RequirePermissions('operational.warehouses.manage')
  async update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.warehousesService.update(req.user.organizationId, id, body);
  }
}
