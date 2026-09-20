import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { PrismaClientManager } from '../../common/prisma/prisma-client.manager';

@Controller('iam/roles')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly prismaManager: PrismaClientManager
  ) {}

  @Get()
  @RequirePermissions('iam.roles.view')
  async getAllRoles(@CurrentUser() user: AuthenticatedUser) {
    return this.prismaManager.client.role.findMany({
      where: { organizationId: user.organizationId },
      include: {
        permissions: {
          include: { permission: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Post()
  @RequirePermissions('iam.roles.create')
  async createRole(@CurrentUser() user: AuthenticatedUser, @Body() data: { name: string; description?: string; permissions: string[] }) {
    const role = await this.rolesService.createRole(user.organizationId, {
      name: data.name,
      description: data.description,
    });
    
    // Assign permissions manually since no PrismaService wrapper for complex logic was provided
    if (data.permissions && data.permissions.length > 0) {
      for (const pName of data.permissions) {
        const perm = await this.prismaManager.client.permission.findUnique({ where: { action: pName } });
        if (perm) {
          await this.prismaManager.client.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: perm.id
            }
          });
        }
      }
    }
    
    return role;
  }

  @Delete(':id')
  @RequirePermissions('iam.roles.delete')
  async deleteRole(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.prismaManager.client.role.delete({
      where: {
        id,
        organizationId: user.organizationId
      }
    });
  }
}
