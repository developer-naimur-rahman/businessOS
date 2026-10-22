import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { StaffAuditService } from './staff-audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.interface';

@Controller('admin/security')
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class StaffAuditController {
  constructor(private readonly auditService: StaffAuditService) {}

  @Get('role-matrix')
  async getRoleMatrix(@CurrentUser() user: AuthenticatedUser) {
    return this.auditService.getRoleMatrix(user.organizationId);
  }

  @Post('role-matrix')
  async saveRoleMatrix(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { roles: any[] },
  ) {
    return this.auditService.saveRoleMatrix(user.organizationId, body.roles);
  }

  @Get('audit-logs')
  async getAuditLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Query('staffUserId') staffUserId?: string,
    @Query('module') module?: string,
    @Query('riskLevel') riskLevel?: string,
  ) {
    return this.auditService.getAuditLogs(user.organizationId, {
      staffUserId,
      module,
      riskLevel,
    });
  }
}
