import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  // Used internally (e.g. auth strategy) where organizationId might not be available yet, but should be avoided in normal business logic.
  async findById(id: string) {
    return this.usersRepository.findByIdUnsafe(id);
  }

  async findByIdWithinOrganization(organizationId: string, id: string) {
    return this.usersRepository.findByIdAndOrganization(organizationId, id);
  }

  async createUser(organizationId: string, data: any) {
    const hashedPassword = await argon2.hash(data.password);
    return this.usersRepository.create(organizationId, {
      ...data,
      password: hashedPassword,
    });
  }

  async updateUser(organizationId: string, id: string, data: any) {
    const user = await this.findByIdWithinOrganization(organizationId, id);
    
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await argon2.hash(data.password);
    }
    
    return this.usersRepository.update(user.id, updateData);
  }

  async assignRole(organizationId: string, userId: string, roleId: string) {
    await this.findByIdWithinOrganization(organizationId, userId);
    // Note: Role validation should ideally be done through a RolesService or RolesRepository
    // to enforce organizationId scoping for the role itself.
    // For now, since we removed PrismaService, we assume the caller or another service
    // validates the role belongs to the organization.
    // We will do this via RolesService or RolesRepository shortly.
    return this.usersRepository.assignRole(userId, roleId);
  }

  async removeRole(organizationId: string, userId: string, roleId: string) {
    await this.findByIdWithinOrganization(organizationId, userId);
    return this.usersRepository.removeRole(userId, roleId);
  }

  async getEffectivePermissions(userId: string): Promise<{ roleIds: string[], permissions: string[] }> {
    const userWithRoles = await this.usersRepository.getUserWithRoles(userId);

    if (!userWithRoles) {
      return { roleIds: [], permissions: [] };
    }

    const roleIds = new Set<string>();
    const permissions = new Set<string>();

    for (const ur of userWithRoles.userRoles) {
      roleIds.add(ur.roleId);
      for (const rp of ur.role.permissions) {
        permissions.add(rp.permission.action);
      }
    }

    return {
      roleIds: Array.from(roleIds),
      permissions: Array.from(permissions),
    };
  }
}
