import { Module } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { UsersRepository } from './users/users.repository';
import { RolesService } from './roles/roles.service';
import { RolesRepository } from './roles/roles.repository';
import { PermissionsGuard } from './guards/permissions.guard';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UsersService, UsersRepository, RolesService, RolesRepository, PermissionsGuard],
  exports: [UsersService, UsersRepository, RolesService, RolesRepository, PermissionsGuard],
})
export class IamModule {}
