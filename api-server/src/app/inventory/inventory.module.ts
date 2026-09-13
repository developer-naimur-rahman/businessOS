import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { BusinessCoreModule } from '../business-core/business-core.module';
import { OperationalStructureModule } from '../operational-structure/operational-structure.module';
import { InventoryMovementsRepository } from './inventory-movements.repository';
import { StockBalancesRepository } from './stock-balances.repository';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [PrismaModule, BusinessCoreModule, OperationalStructureModule],
  controllers: [InventoryController],
  providers: [
    InventoryMovementsRepository,
    StockBalancesRepository,
    InventoryService,
  ],
  exports: [InventoryService],
})
export class InventoryModule {}
