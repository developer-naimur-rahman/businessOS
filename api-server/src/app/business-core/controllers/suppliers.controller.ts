import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { SuppliersService } from '../services/suppliers.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../iam/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('business-core/suppliers')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @RequirePermissions('businesscore.suppliers.manage')
  async create(@Request() req, @Body() body: any) {
    return this.suppliersService.create(req.user.organizationId, body);
  }

  @Get()
  @RequirePermissions('businesscore.suppliers.view')
  async findAll(@Request() req) {
    return this.suppliersService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @RequirePermissions('businesscore.suppliers.view')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.suppliersService.findOne(req.user.organizationId, id);
  }

  @Put(':id')
  @RequirePermissions('businesscore.suppliers.manage')
  async update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.suppliersService.update(req.user.organizationId, id, body);
  }
}
