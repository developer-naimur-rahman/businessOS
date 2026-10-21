import { Controller, Post, Get, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { DropshippingService, DropshipAnalyzeDto, DropshipImportDto } from './dropshipping.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.interface';

@Controller('admin/dropshipping')
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class DropshippingController {
  constructor(private readonly dropshippingService: DropshippingService) {}

  @Post('ai-analyze')
  async analyze(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DropshipAnalyzeDto,
  ) {
    return this.dropshippingService.analyzeProduct(user.organizationId, user.userId, dto);
  }

  @Post('extract-from-url')
  async extractFromUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { url: string; platformHint?: string },
  ) {
    return this.dropshippingService.extractProductFromUrl(body.url, body.platformHint);
  }

  @Post('ai-copilot')
  async copilotChat(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { message: string },
  ) {
    return this.dropshippingService.copilotChat(user.organizationId, body.message);
  }

  @Get('watchlist')
  async getWatchlist(@CurrentUser() user: AuthenticatedUser) {
    return this.dropshippingService.getWatchlist(user.organizationId);
  }

  @Delete('watchlist/:id')
  async deleteWatchlist(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.dropshippingService.deleteWatchlist(user.organizationId, id);
  }

  @Post('import-product')
  async importProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DropshipImportDto,
  ) {
    return this.dropshippingService.importProduct(user.organizationId, user.userId, dto);
  }

  @Get('orders')
  async getDropshipOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.dropshippingService.getDropshipOrders(user.organizationId);
  }

  @Patch('orders/:saleId/dispatch')
  async dispatchOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('saleId') saleId: string,
    @Body() body: { supplierRef?: string; note?: string },
  ) {
    return this.dropshippingService.dispatchDropshipOrder(
      user.organizationId,
      saleId,
      body.supplierRef,
      body.note,
    );
  }
}
