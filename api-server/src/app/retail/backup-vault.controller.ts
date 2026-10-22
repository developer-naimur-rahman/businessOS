import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { BackupVaultService } from './backup-vault.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('admin/system/backup')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class BackupVaultController {
  constructor(private readonly backupVaultService: BackupVaultService) {}

  @Post('create')
  @RequirePermissions('system.manage')
  async createBackup(@Request() req: any) {
    return this.backupVaultService.createBackup(req.user.organizationId, req.user.id || null);
  }

  @Get('list')
  @RequirePermissions('system.view')
  async listBackups(@Request() req: any) {
    return this.backupVaultService.listBackups(req.user.organizationId);
  }

  @Post('verify')
  @RequirePermissions('system.manage')
  async verifyBackup(@Body() body: any) {
    return this.backupVaultService.verifyBackup(body);
  }
}
