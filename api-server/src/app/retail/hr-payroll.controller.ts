import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { HrPayrollService, RecordAttendanceDto, PaySalaryDto } from './hr-payroll.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('admin/hr-payroll')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class HrPayrollController {
  constructor(private readonly hrPayrollService: HrPayrollService) {}

  @Post('attendance')
  @RequirePermissions('iam.users.manage')
  async recordAttendance(@Request() req: any, @Body() body: RecordAttendanceDto) {
    return this.hrPayrollService.recordAttendance(req.user.organizationId, req.user.id || null, body);
  }

  @Get('attendance')
  @RequirePermissions('iam.users.view')
  async getAttendance(@Request() req: any, @Query('date') date?: string) {
    return this.hrPayrollService.getAttendance(req.user.organizationId, date);
  }

  @Get('payroll-sheet')
  @RequirePermissions('finance.view')
  async getPayrollSheet(@Request() req: any, @Query('month') month?: string) {
    return this.hrPayrollService.getPayrollSheet(req.user.organizationId, month);
  }

  @Post('pay-salary')
  @RequirePermissions('finance.manage')
  async paySalary(@Request() req: any, @Body() body: PaySalaryDto) {
    return this.hrPayrollService.paySalary(req.user.organizationId, req.user.id || null, body);
  }
}
