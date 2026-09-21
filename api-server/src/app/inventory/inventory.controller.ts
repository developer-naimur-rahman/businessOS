import { Controller, Get, Post, Body, Query, Request, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { Prisma } from '@prisma/client';

@Controller('inventory')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('balances')
  @RequirePermissions('inventory.view')
  async getBalances(@Request() req, @Query('warehouseId') warehouseId?: string, @Query('variantId') variantId?: string, @Query('productId') productId?: string) {
    return this.inventoryService.getBalances(req.user.organizationId, warehouseId, variantId, productId);
  }

  @Get('movements')
  @RequirePermissions('inventory.view')
  async getMovements(@Request() req, @Query('warehouseId') warehouseId?: string, @Query('variantId') variantId?: string) {
    return this.inventoryService.getMovements(req.user.organizationId, warehouseId, variantId);
  }

  @Post('adjustments')
  @RequirePermissions('inventory.adjust')
  async createAdjustment(
    @Request() req,
    @Body()
    data: {
      warehouseId: string;
      variantId: string;
      quantity: string | number;
      type: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT';
      referenceType?: string;
      referenceId?: string;
      notes?: string;
      idempotencyKey?: string;
    },
  ) {
    return this.inventoryService.createAdjustment(
      req.user.organizationId,
      { ...data, quantity: new Prisma.Decimal(data.quantity) },
      req.user.id,
    );
  }

  @Post('transfers')
  @RequirePermissions('inventory.transfer')
  async createTransfer(
    @Request() req,
    @Body()
    data: {
      sourceWarehouseId: string;
      destinationWarehouseId: string;
      variantId: string;
      quantity: string | number;
      referenceType?: string;
      referenceId?: string;
      notes?: string;
      idempotencyKey?: string;
    },
  ) {
    return this.inventoryService.createTransfer(
      req.user.organizationId,
      { ...data, quantity: new Prisma.Decimal(data.quantity) },
      req.user.id,
    );
  }
}
