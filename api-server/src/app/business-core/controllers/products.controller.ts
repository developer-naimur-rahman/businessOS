import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../iam/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('business-core/products')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @RequirePermissions('businesscore.products.manage')
  async create(@Request() req, @Body() body: any) {
    return this.productsService.create(req.user.organizationId, body);
  }

  @Get()
  @RequirePermissions('businesscore.products.view')
  async findAll(@Request() req) {
    return this.productsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @RequirePermissions('businesscore.products.view')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.productsService.findOne(req.user.organizationId, id);
  }

  @Put(':id')
  @RequirePermissions('businesscore.products.manage')
  async update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.productsService.update(req.user.organizationId, id, body);
  }
}
