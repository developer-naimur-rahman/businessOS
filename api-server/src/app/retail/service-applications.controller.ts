import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ServiceApplicationsService } from './service-applications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

// Public endpoints for customers submitting requests and approving drafts
@Controller('public/service-request')
export class PublicServiceRequestController {
  constructor(private readonly applicationsService: ServiceApplicationsService) {}

  @Post()
  async submitRequest(@Body() body: any) {
    return this.applicationsService.submitApplication(body);
  }

  @Post('extract-and-map')
  @HttpCode(HttpStatus.OK)
  async extractAndMap(@Body() body: any) {
    return this.applicationsService.extractAndMapApplication(body);
  }

  @Post(':ref/approve')
  async approveDraft(@Param('ref') ref: string, @Body() body: { notes?: string }) {
    return this.applicationsService.customerApproveDraft(ref, body.notes);
  }
}

// Admin management endpoints for the application pipeline, copy assistant & deliverables
@Controller('admin/service-applications')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class AdminServiceApplicationsController {
  constructor(private readonly applicationsService: ServiceApplicationsService) {}

  @Get()
  @RequirePermissions('services.view')
  async getApplications(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    return this.applicationsService.getApplications(req.user.organizationId, status, search);
  }

  @Get(':ref')
  @RequirePermissions('services.view')
  async getApplicationByRef(@Request() req: any, @Param('ref') ref: string) {
    return this.applicationsService.getApplicationByRef(req.user.organizationId, ref);
  }

  @Patch(':ref/status')
  @RequirePermissions('services.manage')
  async updateStatus(
    @Request() req: any,
    @Param('ref') ref: string,
    @Body() body: { status: any; notes?: string; assignedStaffName?: string }
  ) {
    return this.applicationsService.updateStatus(
      req.user.organizationId,
      req.user.id || req.user.sub,
      ref,
      body.status,
      body.notes,
      body.assignedStaffName
    );
  }

  @Patch(':ref/payment')
  @RequirePermissions('services.manage')
  async verifyPayment(
    @Request() req: any,
    @Param('ref') ref: string,
    @Body() body: { paymentStatus: 'VERIFIED' | 'REJECTED'; verifiedAmountBdt?: number; notes?: string }
  ) {
    return this.applicationsService.verifyPayment(
      req.user.organizationId,
      req.user.id || req.user.sub,
      ref,
      body.paymentStatus,
      body.verifiedAmountBdt,
      body.notes
    );
  }

  @Patch(':ref/field')
  @RequirePermissions('services.manage')
  async updateField(
    @Request() req: any,
    @Param('ref') ref: string,
    @Body() body: { fieldKey: string; newValue: string }
  ) {
    return this.applicationsService.updateFieldValue(
      req.user.organizationId,
      req.user.id || req.user.sub,
      ref,
      body.fieldKey,
      body.newValue
    );
  }

  @Patch(':ref/verify-field')
  @RequirePermissions('services.manage')
  async verifyField(
    @Request() req: any,
    @Param('ref') ref: string,
    @Body() body: { fieldKey: string; isVerified: boolean; notes?: string }
  ) {
    return this.applicationsService.verifyField(
      req.user.organizationId,
      req.user.id || req.user.sub,
      ref,
      body.fieldKey,
      body.isVerified,
      body.notes
    );
  }

  @Patch(':ref/resolve-conflict')
  @RequirePermissions('services.manage')
  async resolveConflict(
    @Request() req: any,
    @Param('ref') ref: string,
    @Body() body: { fieldKey: string; resolvedValue: string; resolutionNote: string }
  ) {
    return this.applicationsService.resolveConflict(
      req.user.organizationId,
      req.user.id || req.user.sub,
      ref,
      body.fieldKey,
      body.resolvedValue,
      body.resolutionNote
    );
  }

  @Post(':ref/deliverables')
  @RequirePermissions('services.manage')
  async addDeliverable(
    @Request() req: any,
    @Param('ref') ref: string,
    @Body() body: { title: string; fileUrl: string; type: any }
  ) {
    return this.applicationsService.addDeliverable(
      req.user.organizationId,
      req.user.id || req.user.sub,
      ref,
      body
    );
  }
}
