import { Injectable, ForbiddenException } from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async createRole(organizationId: string, data: any) {
    return this.rolesRepository.create(organizationId, data);
  }

  async findRole(organizationId: string, id: string) {
    return this.rolesRepository.findByIdAndOrganization(organizationId, id);
  }

  async listRoles(organizationId: string) {
    return this.rolesRepository.list(organizationId);
  }

  async assignRoleToUser(organizationId: string, userId: string, roleId: string) {
    const role = await this.findRole(organizationId, roleId);
    await this.usersRepository.findByIdAndOrganization(organizationId, userId);

    return this.usersRepository.assignRole(userId, role.id);
  }

  async removeRoleFromUser(organizationId: string, userId: string, roleId: string) {
    const role = await this.findRole(organizationId, roleId);
    await this.usersRepository.findByIdAndOrganization(organizationId, userId);

    return this.usersRepository.removeRole(userId, role.id);
  }
}
