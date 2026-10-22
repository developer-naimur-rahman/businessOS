import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SourcingListService, CreateWantedProductDto } from './sourcing-list.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('admin/sourcing-list')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class SourcingListController {
  constructor(private readonly sourcingListService: SourcingListService) {}

  @Post('wanted')
  @RequirePermissions('inventory.manage')
  async createWantedItem(@Request() req: any, @Body() body: CreateWantedProductDto) {
    return this.sourcingListService.createWantedItem(req.user.organizationId, req.user.id || null, body);
  }

  @Get()
  @RequirePermissions('inventory.view')
  async getWantedItems(@Request() req: any) {
    return this.sourcingListService.getWantedItems(req.user.organizationId);
  }

  @Get('auto-bazaar-sheet')
  @RequirePermissions('inventory.view')
  async getAutoBazaarSheet(@Request() req: any) {
    return this.sourcingListService.getAutoBazaarSheet(req.user.organizationId);
  }

  @Patch('wanted/:id/fulfill')
  @RequirePermissions('inventory.manage')
  async fulfillWantedItem(@Request() req: any, @Param('id') id: string) {
    return this.sourcingListService.fulfillWantedItem(req.user.organizationId, id);
  }
}
