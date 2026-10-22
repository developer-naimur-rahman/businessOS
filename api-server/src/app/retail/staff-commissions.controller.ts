import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { StaffCommissionsService, CommissionRulesDto, RecordPayoutDto } from './staff-commissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('admin/staff-commissions')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class StaffCommissionsController {
  constructor(private readonly commissionsService: StaffCommissionsService) {}

  @Get('summary')
  @RequirePermissions('iam.manage')
  async getSummary(@Request() req: any) {
    return this.commissionsService.getSummary(req.user.organizationId);
  }

  @Post('rules')
  @RequirePermissions('iam.manage')
  async updateRules(@Request() req: any, @Body() body: CommissionRulesDto) {
    return this.commissionsService.updateRules(req.user.organizationId, body);
  }

  @Post('payout')
  @RequirePermissions('iam.manage')
  async recordPayout(@Request() req: any, @Body() body: RecordPayoutDto) {
    return this.commissionsService.recordPayout(req.user.organizationId, req.user.id || null, body);
  }
}
