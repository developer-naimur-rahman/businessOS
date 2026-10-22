import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SupplierLedgerService, SupplierTransactionDto } from './supplier-ledger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.interface';

@Controller('admin/suppliers')
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class SupplierLedgerController {
  constructor(private readonly ledgerService: SupplierLedgerService) {}

  @Get('ledger')
  async getLedgerSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.ledgerService.getLedgerSummary(user.organizationId);
  }

  @Get(':id/statement')
  async getStatement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') supplierId: string,
  ) {
    return this.ledgerService.getSupplierStatement(user.organizationId, supplierId);
  }

  @Post('ledger/transaction')
  async recordTransaction(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SupplierTransactionDto,
  ) {
    return this.ledgerService.recordTransaction(user.organizationId, user.userId, dto);
  }
}
