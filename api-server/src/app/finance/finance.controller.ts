import { Controller, Get, Post, Body, Request, UseGuards, Param } from '@nestjs/common';
import { FinanceService, CreateJournalEntryDto } from './finance.service';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('accounts')
  @RequirePermissions('finance.view')
  async getAccounts(@Request() req) {
    return this.financeService.getAccounts(req.user.organizationId);
  }

  @Get('journal-entries')
  @RequirePermissions('finance.view')
  async getJournalEntries(@Request() req) {
    return this.financeService.getJournalEntries(req.user.organizationId);
  }

  @Post('journal-entries')
  @RequirePermissions('finance.manage')
  async createDraftJournalEntry(@Request() req, @Body() data: CreateJournalEntryDto) {
    return this.financeService.createDraftJournalEntry(req.user.organizationId, req.user.id, data);
  }

  @Post('journal-entries/:id/post')
  @RequirePermissions('finance.manage')
  async postJournalEntry(@Request() req, @Param('id') id: string) {
    return this.financeService.postJournalEntry(req.user.organizationId, id, req.user.id);
  }
}
