import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../iam/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('operational-structure/branches')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @RequirePermissions('operational.branches.manage')
  async create(@Request() req, @Body() body: any) {
    return this.branchesService.create(req.user.organizationId, body);
  }

  @Get()
  @RequirePermissions('operational.branches.view')
  async findAll(@Request() req) {
    return this.branchesService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @RequirePermissions('operational.branches.view')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.branchesService.findOne(req.user.organizationId, id);
  }

  @Put(':id')
  @RequirePermissions('operational.branches.manage')
  async update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.branchesService.update(req.user.organizationId, id, body);
  }
}
