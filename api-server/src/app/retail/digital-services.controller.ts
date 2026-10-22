import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { DigitalServicesService, RecordDigitalTransactionDto, AdjustFloatDto } from './digital-services.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('admin/digital-services')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class DigitalServicesController {
  constructor(private readonly digitalServicesService: DigitalServicesService) {}

  @Get('summary')
  @RequirePermissions('services.view')
  async getSummary(@Request() req: any) {
    return this.digitalServicesService.getSummary(req.user.organizationId);
  }

  @Post('float-adjust')
  @RequirePermissions('services.manage')
  async adjustFloat(@Request() req: any, @Body() body: AdjustFloatDto) {
    return this.digitalServicesService.adjustFloat(req.user.organizationId, req.user.id || null, body);
  }

  @Post('transaction')
  @RequirePermissions('services.manage')
  async recordTransaction(@Request() req: any, @Body() body: RecordDigitalTransactionDto) {
    return this.digitalServicesService.recordTransaction(req.user.organizationId, req.user.id || null, body);
  }
}
