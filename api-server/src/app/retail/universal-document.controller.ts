import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UniversalDocumentService, DocumentCategory, DocumentServiceMode } from './universal-document.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PrismaService } from '../common/prisma/prisma.service';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';

@Controller('admin/document-studio')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class AdminUniversalDocumentController {
  constructor(private readonly docService: UniversalDocumentService) {}

  @Get('templates')
  @RequirePermissions('services.view')
  async getTemplates(@Request() req: any, @Query('category') category?: string) {
    return this.docService.getTemplates(req.user.organizationId, category);
  }

  @Post('templates')
  @RequirePermissions('services.manage')
  async saveTemplateConfig(@Request() req: any, @Body() body: any) {
    return this.docService.saveTemplateConfig(req.user.organizationId, req.user.id || req.user.sub, body);
  }

  @Get('orders')
  @RequirePermissions('services.view')
  async getOrders(
    @Request() req: any,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('serviceMode') serviceMode?: string,
    @Query('search') search?: string
  ) {
    return this.docService.getDocumentOrders(req.user.organizationId, { category, status, serviceMode, search });
  }

  @Get('orders/:id')
  @RequirePermissions('services.view')
  async getOrder(@Request() req: any, @Param('id') id: string) {
    return this.docService.getOrder(req.user.organizationId, id);
  }

  @Post('orders')
  @RequirePermissions('services.manage')
  async createOrder(@Request() req: any, @Body() body: any) {
    return this.docService.createDocumentOrder(req.user.organizationId, req.user.id || req.user.sub, body);
  }

  @Patch('orders/:id/status')
  @RequirePermissions('services.manage')
  async updateOrderStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any
  ) {
    return this.docService.updateOrderStatus(req.user.organizationId, req.user.id || req.user.sub, id, body);
  }
}

@Controller('public/document-studio')
@UseGuards(RateLimitGuard)
export class PublicUniversalDocumentController {
  constructor(
    private readonly docService: UniversalDocumentService,
    private readonly prisma: PrismaService
  ) {}

  private async getOrganizationId(): Promise<string> {
    const org = await this.prisma.organization.findFirst();
    if (!org) throw new NotFoundException('Storefront organization not configured.');
    return org.id;
  }

  @Get('templates')
  @RateLimit({ limit: 60, ttlSeconds: 60 })
  async getPublicTemplates(@Query('category') category?: string) {
    const orgId = await this.getOrganizationId();
    const all = await this.docService.getTemplates(orgId, category);
    return all.filter((t) => t.isPublished && t.isCustomerSelfService);
  }

  @Post('orders')
  @RateLimit({ limit: 10, ttlSeconds: 60 })
  async submitPublicOrder(@Body() body: any) {
    const orgId = await this.getOrganizationId();
    return this.docService.createDocumentOrder(orgId, null, body);
  }

  @Get('orders/:orderNumber')
  @RateLimit({ limit: 30, ttlSeconds: 60 })
  async trackPublicOrder(@Param('orderNumber') orderNumber: string) {
    const orgId = await this.getOrganizationId();
    const order = await this.docService.getOrder(orgId, orderNumber);
    // Public response returns order tracking status without exposing private PII
    return {
      orderNumber: order.orderNumber,
      customerNameMasked: order.customerName ? order.customerName.slice(0, 2) + '***' : 'Customer',
      category: order.category,
      templateTitleBn: order.templateTitleBn,
      serviceMode: order.serviceMode,
      fulfillmentStatus: order.fulfillmentStatus,
      paymentStatus: order.paymentStatus,
      totalAmountBdt: order.financials.totalAmountBdt,
      watermarkRemoved: order.watermarkRemoved,
      downloadAuthorized: order.watermarkRemoved,
      downloadToken: order.watermarkRemoved ? order.downloadToken : null,
      createdAt: order.createdAt,
    };
  }
}
