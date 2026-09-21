import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PurchasesService } from '../services/purchases.service';
import { CreatePurchaseDto, UpdatePurchaseDto, AddPurchasePaymentDto } from '../dto/purchase.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../iam/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Request } from 'express';

@Controller('purchases')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class PurchasesController {
  constructor(private readonly service: PurchasesService) {}

  @Post()
  @RequirePermissions('purchases.create')
  async createDraft(@Req() req: Request, @Body() dto: CreatePurchaseDto) {
    const orgId = (req.user as any).organizationId;
    const userId = (req.user as any).userId;
    return this.service.createDraft(orgId, userId, dto);
  }

  @Get()
  @RequirePermissions('purchases.view')
  async findAll(
    @Req() req: Request,
    @Query('supplierId') supplierId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('branchId') branchId?: string,
    @Query('status') status?: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const orgId = (req.user as any).organizationId;
    return this.service.findMany(orgId, {
      supplierId,
      warehouseId,
      branchId,
      status,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get(':id')
  @RequirePermissions('purchases.view')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const orgId = (req.user as any).organizationId;
    return this.service.findOne(orgId, id);
  }

  @Put(':id')
  @RequirePermissions('purchases.update')
  async updateDraft(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdatePurchaseDto) {
    const orgId = (req.user as any).organizationId;
    return this.service.updateDraft(orgId, id, dto);
  }

  @Post(':id/complete')
  @RequirePermissions('purchases.manage')
  async completePurchase(@Req() req: Request, @Param('id') id: string) {
    const orgId = (req.user as any).organizationId;
    const userId = (req.user as any).userId;
    return this.service.completePurchase(orgId, id, userId);
  }

  @Post(':id/payments')
  @RequirePermissions('purchases.manage')
  async addPayment(@Req() req: Request, @Param('id') id: string, @Body() dto: AddPurchasePaymentDto) {
    const orgId = (req.user as any).organizationId;
    return this.service.addPayment(orgId, id, dto);
  }
}
