import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PrintQueueService, CreatePrintDropDto } from './print-queue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

// Public endpoint for walk-in customer file drop
@Controller('public/print-drop')
export class PublicPrintDropController {
  constructor(private readonly printQueueService: PrintQueueService) {}

  @Post()
  async submitDrop(@Body() body: CreatePrintDropDto) {
    return this.printQueueService.submitPrintDrop(body);
  }
}

// Admin management endpoint for print desk
@Controller('admin/print-queue')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class AdminPrintQueueController {
  constructor(private readonly printQueueService: PrintQueueService) {}

  @Get()
  @RequirePermissions('services.view')
  async getQueue(@Request() req: any, @Query('status') status?: string) {
    return this.printQueueService.getPrintQueue(req.user.organizationId, status);
  }

  @Patch(':id/status')
  @RequirePermissions('services.manage')
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { status: string; finalCostBdt?: number }
  ) {
    return this.printQueueService.updateStatus(req.user.organizationId, id, body.status, body.finalCostBdt);
  }

  @Get('qr-config')
  @RequirePermissions('services.view')
  async getQrConfig(@Request() req: any) {
    return this.printQueueService.getQrConfig(req.user.organizationId);
  }
}
