import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { FilterProductDto } from '../dto/filter-product.dto';
import { BulkProductOperationDto } from '../dto/bulk-product.dto';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../iam/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
@Controller('business-core/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @RequirePermissions('catalog.manage')
  create(@Request() req, @Body() createProductDto: CreateProductDto) {
    const organizationId = req.user.organizationId;
    return this.productsService.create(organizationId, createProductDto);
  }

  @Get()
  @RequirePermissions('catalog.view')
  findAll(@Request() req, @Query() filterDto: FilterProductDto) {
    const organizationId = req.user.organizationId;
    return this.productsService.findAll(organizationId, filterDto);
  }

  @Get(':id')
  @RequirePermissions('catalog.view')
  findOne(@Request() req, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.productsService.findOne(organizationId, id);
  }

  @Patch(':id')
  @RequirePermissions('catalog.manage')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateProductDto: Prisma.ProductUpdateInput,
  ) {
    const organizationId = req.user.organizationId;
    return this.productsService.update(organizationId, id, updateProductDto);
  }

  @Post('bulk')
  @RequirePermissions('catalog.manage')
  bulkOperation(@Request() req, @Body() bulkDto: BulkProductOperationDto) {
    const organizationId = req.user.organizationId;
    return this.productsService.bulkOperation(organizationId, bulkDto);
  }

  @Delete(':id')
  @RequirePermissions('catalog.manage')
  archive(@Request() req, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.productsService.archive(organizationId, id);
  }
}
