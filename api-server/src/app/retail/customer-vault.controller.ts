import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CustomerVaultService } from './customer-vault.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PrismaService } from '../common/prisma/prisma.service';
import { CustomerJwtAuthGuard } from '../auth/guards/customer-jwt-auth.guard';

// Public endpoints for customers
@Controller('public/customer-vault')
export class PublicCustomerVaultController {
  constructor(
    private readonly vaultService: CustomerVaultService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Phase 2.1 & 2.2 Security Fix:
   * Do NOT expose private citizen details (NID, DOB, addresses, documents)
   * to unauthenticated callers who simply probe a phone number.
   * Return only a masked indicator and instruction to log in.
   */
  @Get('lookup')
  async lookupProfile(@Query('phone') phone: string) {
    if (!phone || phone.length < 10) {
      return { found: false, message: 'Valid phone number required for vault lookup.' };
    }

    const org = await this.prisma.organization.findFirst();
    if (!org) return { found: false };

    const profile = await this.vaultService.getProfile(org.id, phone);
    if (!profile) return { found: false, message: 'No vault record found for this phone.' };

    return {
      found: true,
      requiresLogin: true,
      maskedName: profile.nameEn ? profile.nameEn.slice(0, 2) + '***' : 'Citizen',
      message: 'Vault profile found. Please log in to your Customer Account to securely prefill applications and access your documents.',
      hasSavedDocs: (profile.documents || []).length > 0,
    };
  }

  @Post('ocr-helper')
  async runOcrHelper(@Body() body: { textOrSnippet: string; docType: string }) {
    return this.vaultService.extractDocumentFields(body.textOrSnippet || '', body.docType || 'DOCUMENT');
  }
}

// Authenticated Customer Workspace Endpoints
@Controller('customer/vault')
@UseGuards(CustomerJwtAuthGuard)
export class AuthenticatedCustomerVaultController {
  constructor(
    private readonly vaultService: CustomerVaultService,
    private readonly prisma: PrismaService
  ) {}

  private async getOrganizationId(): Promise<string> {
    const org = await this.prisma.organization.findFirst();
    if (!org) throw new NotFoundException('Storefront organization not configured.');
    return org.id;
  }

  /**
   * Get authenticated customer's own complete profile, documents, and dynamic fields
   */
  @Get('me')
  async getMyProfile(@Request() req: any) {
    const orgId = req.user.orgId || (await this.getOrganizationId());
    const profile = await this.vaultService.getProfileByCustomerId(orgId, req.user.customerId);
    if (!profile) {
      throw new NotFoundException('Customer profile not initialized.');
    }
    return profile;
  }

  /**
   * Update authenticated customer's profile info
   */
  @Put('me')
  async updateMyProfile(@Request() req: any, @Body() body: any) {
    const orgId = req.user.orgId || (await this.getOrganizationId());
    return this.vaultService.upsertProfile(orgId, req.user.customerId, {
      ...body,
      customerId: req.user.customerId,
    });
  }

  /**
   * Phase 3.2: Collective multi-file upload and AI extraction
   */
  @Post('multi-upload')
  async uploadMultipleDocuments(@Request() req: any, @Body() body: { documents: any[] }) {
    if (!body.documents || !Array.isArray(body.documents) || body.documents.length === 0) {
      throw new BadRequestException('At least one document is required.');
    }
    const orgId = req.user.orgId || (await this.getOrganizationId());
    return this.vaultService.processMultipleDocumentsCollective(orgId, req.user.customerId, body.documents);
  }

  /**
   * Phase 3.5: Edit or approve/reject dynamic fields
   */
  @Put('field')
  async updateField(@Request() req: any, @Body() body: { fieldId: string; update: any }) {
    if (!body.fieldId || !body.update) {
      throw new BadRequestException('fieldId and update payload are required.');
    }
    const orgId = req.user.orgId || (await this.getOrganizationId());
    return this.vaultService.updateDynamicField(orgId, req.user.customerId, body.fieldId, body.update);
  }

  /**
   * Phase 3.5: Delete a dynamic field
   */
  @Delete('field/:fieldId')
  async deleteField(@Request() req: any, @Param('fieldId') fieldId: string) {
    const orgId = req.user.orgId || (await this.getOrganizationId());
    return this.vaultService.deleteDynamicField(orgId, req.user.customerId, fieldId);
  }

  /**
   * Phase 2.2: Update privacy & AI consent preferences
   */
  @Post('consent')
  async updateConsent(
    @Request() req: any,
    @Body() body: { consentGiven: boolean; aiProcessingConsented: boolean; purposeBn?: string }
  ) {
    const orgId = req.user.orgId || (await this.getOrganizationId());
    return this.vaultService.updatePrivacyConsent(orgId, req.user.customerId, body);
  }

  /**
   * Phase 2.2: Data erasure request
   */
  @Post('erasure-request')
  async requestErasure(@Request() req: any, @Body() body: { reason?: string }) {
    const orgId = req.user.orgId || (await this.getOrganizationId());
    return this.vaultService.requestDataErasure(orgId, req.user.customerId, body.reason);
  }

  /**
   * Phase 4: Get this customer's applications (Layer B application records)
   */
  @Get('applications')
  async getMyApplications(@Request() req: any) {
    const orgId = req.user.orgId || (await this.getOrganizationId());
    const customer = await this.prisma.customer.findFirst({
      where: { organizationId: orgId, id: req.user.customerId },
    });
    const cleanPhone = (customer?.phone || '').replace(/[^0-9]/g, '');

    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId: orgId,
        entityType: 'InternetServiceApplication',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const myApps = logs
      .map(l => (l.newData as any) || {})
      .filter(app => {
        const appPhone = (app.customerPhone || '').replace(/[^0-9]/g, '');
        return (
          app.customerId === req.user.customerId ||
          (cleanPhone.length >= 10 && appPhone.includes(cleanPhone.slice(-10)))
        );
      });

    return myApps;
  }
}

// Admin management endpoints for customer vault
@Controller('admin/customer-vault')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class AdminCustomerVaultController {
  constructor(private readonly vaultService: CustomerVaultService) {}

  @Get(':phoneOrId')
  @RequirePermissions('customers.view')
  async getProfile(@Request() req: any, @Param('phoneOrId') phoneOrId: string) {
    const profile = await this.vaultService.getProfile(req.user.organizationId, phoneOrId);
    if (!profile) throw new NotFoundException('Customer vault profile not found.');
    return profile;
  }

  @Post()
  @RequirePermissions('customers.manage')
  async saveProfile(@Request() req: any, @Body() body: any) {
    return this.vaultService.upsertProfile(req.user.organizationId, req.user.id || req.user.sub, body);
  }
}
