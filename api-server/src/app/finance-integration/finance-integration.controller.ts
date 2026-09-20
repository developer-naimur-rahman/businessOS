import { Controller, Post, Get, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { FinanceIntegrationService } from './finance-integration.service';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PrismaClientManager } from '../common/prisma/prisma-client.manager';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('finance-integration')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class FinanceIntegrationController {
  constructor(
    private readonly financeIntegrationService: FinanceIntegrationService,
    private readonly prismaManager: PrismaClientManager
  ) {}

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

  @Get('status')
  @RequirePermissions('finance.integration.view')
  async getIntegrationStatus(@Req() req: any) {
    const recentEvents = await this.prismaManager.client.outboxEvent.findMany({
      where: { organizationId: req.user.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    const pendingCount = await this.prismaManager.client.outboxEvent.count({
      where: { 
        organizationId: req.user.organizationId,
        status: 'PENDING'
      }
    });

    return {
      recentEvents,
      pendingCount,
      isAutoSyncEnabled: true // Hardcoded for now based on current architecture
    };
  }
}
