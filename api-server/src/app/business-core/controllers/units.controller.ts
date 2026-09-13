import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { UnitsService } from '../services/units.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../iam/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('business-core/units')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @RequirePermissions('businesscore.units.manage')
  async create(@Request() req, @Body() body: any) {
    return this.unitsService.create(req.user.organizationId, body);
  }

  @Get()
  @RequirePermissions('businesscore.units.view')
  async findAll(@Request() req) {
    return this.unitsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @RequirePermissions('businesscore.units.view')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.unitsService.findOne(req.user.organizationId, id);
  }

  @Put(':id')
  @RequirePermissions('businesscore.units.manage')
  async update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.unitsService.update(req.user.organizationId, id, body);
  }
}
