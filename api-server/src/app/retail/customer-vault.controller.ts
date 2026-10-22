import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { CustomerVaultService } from './customer-vault.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PrismaService } from '../common/prisma/prisma.service';

// Public endpoints for customers filling self-service applications
@Controller('public/customer-vault')
export class PublicCustomerVaultController {
  constructor(
    private readonly vaultService: CustomerVaultService,
    private readonly prisma: PrismaService
  ) {}

  @Get('lookup')
  async lookupProfile(@Query('phone') phone: string) {
    if (!phone || phone.length < 10) {
      return { found: false, message: 'Valid phone number required for vault lookup.' };
    }

    const org = await this.prisma.organization.findFirst();
    if (!org) return { found: false };

    const profile = await this.vaultService.getProfile(org.id, phone);
    if (!profile) return { found: false };

    // Return sanitized profile data for prefilling
    return {
      found: true,
      profile: {
        id: profile.id,
        phone: profile.phone,
        nameBn: profile.nameBn,
        nameEn: profile.nameEn,
        fatherNameBn: profile.fatherNameBn,
        fatherNameEn: profile.fatherNameEn,
        motherNameBn: profile.motherNameBn,
        motherNameEn: profile.motherNameEn,
        dob: profile.dob,
        gender: profile.gender,
        nidNumber: profile.nidNumber,
        birthRegNumber: profile.birthRegNumber,
        presentAddress: profile.presentAddress,
        permanentAddress: profile.permanentAddress,
        educationHistory: profile.educationHistory,
        photoUrl: profile.photoUrl,
        signatureUrl: profile.signatureUrl,
        hasSavedDocs: (profile.documents || []).length > 0,
      },
    };
  }

  @Post('ocr-helper')
  async runOcrHelper(@Body() body: { textOrSnippet: string; docType: string }) {
    return this.vaultService.extractDocumentFields(body.textOrSnippet || '', body.docType || 'DOCUMENT');
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
