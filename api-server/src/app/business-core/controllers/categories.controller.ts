import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { CategoriesService } from '../services/categories.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../iam/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('business-core/categories')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @RequirePermissions('businesscore.categories.manage')
  async create(@Request() req, @Body() body: any) {
    return this.categoriesService.create(req.user.organizationId, body);
  }

  @Get()
  @RequirePermissions('businesscore.categories.view')
  async findAll(@Request() req) {
    return this.categoriesService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @RequirePermissions('businesscore.categories.view')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.categoriesService.findOne(req.user.organizationId, id);
  }

  @Put(':id')
  @RequirePermissions('businesscore.categories.manage')
  async update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.categoriesService.update(req.user.organizationId, id, body);
  }
}
