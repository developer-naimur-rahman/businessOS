import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { BakiKhataService, RecordBakiDto, SendReminderDto } from './baki-khata.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('admin/baki-khata')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class BakiKhataController {
  constructor(private readonly bakiKhataService: BakiKhataService) {}

  @Get('ledger')
  @RequirePermissions('customers.view')
  async getLedgerSummary(@Request() req: any) {
    return this.bakiKhataService.getLedgerSummary(req.user.organizationId);
  }

  @Get('customers/:id')
  @RequirePermissions('customers.view')
  async getCustomerStatement(@Request() req: any, @Param('id') id: string) {
    return this.bakiKhataService.getCustomerStatement(req.user.organizationId, id);
  }

  @Post('transaction')
  @RequirePermissions('customers.manage')
  async recordTransaction(@Request() req: any, @Body() body: RecordBakiDto) {
    return this.bakiKhataService.recordTransaction(req.user.organizationId, req.user.id || null, body);
  }

  @Post('send-reminder')
  @RequirePermissions('customers.manage')
  async sendReminder(@Request() req: any, @Body() body: SendReminderDto) {
    return this.bakiKhataService.sendReminder(req.user.organizationId, req.user.id || null, body);
  }
}
