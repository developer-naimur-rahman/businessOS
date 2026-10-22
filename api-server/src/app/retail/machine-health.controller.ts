import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MachineHealthService, RegisterEquipmentDto, LogMaintenanceDto } from './machine-health.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('admin/machine-health')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class MachineHealthController {
  constructor(private readonly machineHealthService: MachineHealthService) {}

  @Get()
  @RequirePermissions('services.view')
  async getEquipmentList(@Request() req: any) {
    return this.machineHealthService.getEquipmentList(req.user.organizationId);
  }

  @Post('equipment')
  @RequirePermissions('services.manage')
  async registerEquipment(@Request() req: any, @Body() body: RegisterEquipmentDto) {
    return this.machineHealthService.registerEquipment(req.user.organizationId, req.user.id || null, body);
  }

  @Post(':id/log-maintenance')
  @RequirePermissions('services.manage')
  async logMaintenance(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: LogMaintenanceDto
  ) {
    return this.machineHealthService.logMaintenance(req.user.organizationId, req.user.id || null, id, body);
  }
}
