import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { StorefrontService } from './storefront.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { ProductCheckoutDto, ServiceCheckoutDto, ServiceQuoteDto, StorageUploadDto } from './storefront.dto';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';

@Controller('storefront')
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  @Get('catalog/products')
  async getProducts(@Query() query: any) {
    const organizationId = await this.storefrontService.getDefaultOrganizationId();
    return this.storefrontService.getCatalogProducts(organizationId, query);
  }

  @Get('catalog/services')
  async getServices(@Query() query: any) {
    const organizationId = await this.storefrontService.getDefaultOrganizationId();
    return this.storefrontService.getCatalogServices(organizationId, query);
  }

  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const organizationId = await this.storefrontService.getDefaultOrganizationId();
    return this.storefrontService.search(organizationId, query, page ? Number(page) : 1, limit ? Number(limit) : 20);
  }

  @Post('ai-assistant')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 25, ttlSeconds: 60 })
  async chatWithAssistant(@Body() body: { message: string }) {
    if (!body?.message?.trim()) {
      throw new BadRequestException('Message is required');
    }
    const organizationId = await this.storefrontService.getDefaultOrganizationId();
    return this.storefrontService.customerAiAssistant(organizationId, body.message);
  }

  @Post('services/:id/quote')
  async quoteService(
    @Param('id') serviceId: string,
    @Body() dto: ServiceQuoteDto,
  ) {
    const organizationId = await this.storefrontService.getDefaultOrganizationId();
    return this.storefrontService.quoteService(organizationId, serviceId, dto);
  }

  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  @Post('storage/upload')
  async uploadStorage(@Request() req: any, @Body() dto: StorageUploadDto) {
    const { organizationId, userId } = req.organizationContext;
    // Note: Assuming userId is the customer ID for the storefront
    return this.storefrontService.uploadStorage(organizationId, userId, dto);
  }

  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  @Post('checkout/products')
  async checkoutProducts(@Request() req: any, @Body() dto: ProductCheckoutDto) {
    const { organizationId, userId } = req.organizationContext;
    return this.storefrontService.checkoutProduct(organizationId, userId, dto, userId);
  }

  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  @Post('checkout/service')
  async checkoutService(@Request() req: any, @Body() dto: ServiceCheckoutDto) {
    const { organizationId, userId } = req.organizationContext;
    return this.storefrontService.checkoutService(organizationId, userId, dto, userId);
  }
}
