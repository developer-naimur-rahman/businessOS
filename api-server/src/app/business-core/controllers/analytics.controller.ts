import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../iam/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('business-core/analytics')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @RequirePermissions('reports.dashboard.view') // Re-using a generic read permission for now, or you can use an analytics specific one.
  async getDashboard(@Request() req, @Query('days') days?: string) {
    const period = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getDashboardData(req.user.organizationId, period);
  }
}
