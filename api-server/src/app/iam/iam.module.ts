import { Module } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { UsersRepository } from './users/users.repository';
import { RolesService } from './roles/roles.service';
import { RolesRepository } from './roles/roles.repository';
import { PermissionsGuard } from './guards/permissions.guard';
import { PrismaModule } from '../common/prisma/prisma.module';
import { UsersController } from './users/users.controller';
import { RolesController } from './roles/roles.controller';
import { StaffAuditController } from './staff-audit.controller';
import { StaffAuditService } from './staff-audit.service';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController, RolesController, StaffAuditController],
  providers: [UsersService, UsersRepository, RolesService, RolesRepository, PermissionsGuard, StaffAuditService],
  exports: [UsersService, UsersRepository, RolesService, RolesRepository, PermissionsGuard, StaffAuditService],
})
export class IamModule {}
