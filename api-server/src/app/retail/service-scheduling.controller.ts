import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ServiceSchedulingService } from './service-scheduling.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PrismaService } from '../common/prisma/prisma.service';

// Public endpoints for customers checking real slot availability and booking
@Controller('public/appointments')
export class PublicAppointmentsController {
  constructor(
    private readonly schedulingService: ServiceSchedulingService,
    private readonly prisma: PrismaService
  ) {}

  @Get('slots')
  async getAvailableSlots(@Query('date') date: string, @Query('service') service?: string) {
    const org = await this.prisma.organization.findFirst();
    if (!org) return { isOpen: false, slots: [] };
    return this.schedulingService.getAvailableSlots(org.id, date, service);
  }

  @Post('book')
  async bookSlot(@Body() body: any) {
    let orgId = body.organizationId;
    if (!orgId) {
      const org = await this.prisma.organization.findFirst();
      if (!org) throw new Error('Organization not found');
      orgId = org.id;
    }
    return this.schedulingService.bookAppointment(orgId, body);
  }
}

// Admin management endpoints for appointment calendar & shop availability
@Controller('admin/service-scheduling')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class AdminServiceSchedulingController {
  constructor(private readonly schedulingService: ServiceSchedulingService) {}

  @Get('settings')
  @RequirePermissions('services.view')
  async getSettings(@Request() req: any) {
    return this.schedulingService.getSettings(req.user.organizationId);
  }

  @Post('settings')
  @RequirePermissions('services.manage')
  async updateSettings(@Request() req: any, @Body() body: any) {
    return this.schedulingService.saveSettings(req.user.organizationId, req.user.id || req.user.sub, body);
  }

  @Get('appointments')
  @RequirePermissions('services.view')
  async getAppointments(
    @Request() req: any,
    @Query('date') date?: string,
    @Query('status') status?: string
  ) {
    return this.schedulingService.getAppointments(req.user.organizationId, date, status);
  }

  @Patch('appointments/:tokenNumber/status')
  @RequirePermissions('services.manage')
  async updateStatus(
    @Request() req: any,
    @Param('tokenNumber') tokenNumber: string,
    @Body() body: { status: 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED'; notes?: string }
  ) {
    return this.schedulingService.updateStatus(
      req.user.organizationId,
      req.user.id || req.user.sub,
      tokenNumber,
      body.status,
      body.notes
    );
  }
}
