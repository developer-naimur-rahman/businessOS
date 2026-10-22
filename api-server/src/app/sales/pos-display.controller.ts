import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('admin/pos')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class PosDisplayController {
  constructor(private readonly salesService: SalesService) {}

  @Get('live-display-state')
  @RequirePermissions('sales.view')
  async getLiveDisplayState(@Request() req: any) {
    return this.salesService.getLiveDisplayState(req.user.organizationId);
  }

  @Post('live-display-state')
  @RequirePermissions('sales.create')
  async updateLiveDisplayState(@Request() req: any, @Body() body: any) {
    return this.salesService.updateLiveDisplayState(req.user.organizationId, body);
  }
}
