import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { BranchesRepository } from './branches/branches.repository';
import { BranchesService } from './branches/branches.service';
import { BranchesController } from './branches/branches.controller';
import { WarehousesRepository } from './warehouses/warehouses.repository';
import { WarehousesService } from './warehouses/warehouses.service';
import { WarehousesController } from './warehouses/warehouses.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BranchesController, WarehousesController],
  providers: [
    BranchesRepository,
    BranchesService,
    WarehousesRepository,
    WarehousesService,
  ],
  exports: [BranchesService, WarehousesService],
})
export class OperationalStructureModule {}
