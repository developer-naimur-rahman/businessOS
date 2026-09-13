import { Controller, Post, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { FinanceIntegrationService } from './finance-integration.service';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('finance-integration')
@UseGuards(OrganizationContextGuard, PermissionsGuard)
export class FinanceIntegrationController {
  constructor(private readonly financeIntegrationService: FinanceIntegrationService) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('finance.integration.process')
  async processOutbox(@Req() req: any) {
    const processedCount = await this.financeIntegrationService.processPendingOutboxEvents(
      req.user.organizationId,
    );
    return {
      message: `Processed ${processedCount} pending events.`,
      processedCount,
    };
  }
}
