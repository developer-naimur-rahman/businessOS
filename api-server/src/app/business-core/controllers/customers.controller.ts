import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { CustomersService } from '../services/customers.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../iam/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('business-core/customers')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @RequirePermissions('businesscore.customers.manage')
  async create(@Request() req, @Body() body: any) {
    return this.customersService.create(req.user.organizationId, body);
  }

  @Get()
  @RequirePermissions('businesscore.customers.view')
  async findAll(@Request() req) {
    return this.customersService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @RequirePermissions('businesscore.customers.view')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.customersService.findOne(req.user.organizationId, id);
  }

  @Put(':id')
  @RequirePermissions('businesscore.customers.manage')
  async update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.customersService.update(req.user.organizationId, id, body);
  }
}
