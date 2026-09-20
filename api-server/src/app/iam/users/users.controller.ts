import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { PrismaClientManager } from '../../common/prisma/prisma-client.manager';

@Controller('iam/users')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly prismaManager: PrismaClientManager
  ) {}

  @Get()
  @RequirePermissions('iam.users.view')
  async getAllUsers(@CurrentUser() user: AuthenticatedUser) {
    return this.prismaManager.client.user.findMany({
      where: { organizationId: user.organizationId },
      include: {
        userRoles: {
          include: { role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Post()
  @RequirePermissions('iam.users.create')
  async createUser(@CurrentUser() user: AuthenticatedUser, @Body() data: any) {
    const { roleIds, ...userData } = data;
    const createdUser = await this.usersService.createUser(user.organizationId, userData);
    
    if (roleIds && roleIds.length > 0) {
      for (const roleId of roleIds) {
        await this.usersService.assignRole(user.organizationId, createdUser.id, roleId);
      }
    }
    
    return createdUser;
  }

  @Put(':id')
  @RequirePermissions('iam.users.update')
  async updateUser(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() data: any) {
    const { roleIds, ...userData } = data;
    const updatedUser = await this.usersService.updateUser(user.organizationId, id, userData);
    
    if (roleIds !== undefined) {
      await this.prismaManager.client.userRole.deleteMany({
        where: { userId: id }
      });
      for (const roleId of roleIds) {
        await this.usersService.assignRole(user.organizationId, id, roleId);
      }
    }
    
    return updatedUser;
  }

  @Delete(':id')
  @RequirePermissions('iam.users.delete')
  async deleteUser(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.prismaManager.client.user.delete({
      where: {
        id,
        organizationId: user.organizationId
      }
    });
  }
}
