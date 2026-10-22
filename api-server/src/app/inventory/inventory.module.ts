import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { BusinessCoreModule } from '../business-core/business-core.module';
import { OperationalStructureModule } from '../operational-structure/operational-structure.module';
import { InventoryMovementsRepository } from './inventory-movements.repository';
import { StockBalancesRepository } from './stock-balances.repository';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { BarcodeStudioController } from './barcode-studio.controller';
import { SourcingListController } from './sourcing-list.controller';
import { SourcingListService } from './sourcing-list.service';

@Module({
  imports: [PrismaModule, BusinessCoreModule, OperationalStructureModule],
  controllers: [InventoryController, BarcodeStudioController, SourcingListController],
  providers: [
    InventoryMovementsRepository,
    StockBalancesRepository,
    InventoryService,
    SourcingListService,
  ],
  exports: [InventoryService, SourcingListService],
})
export class InventoryModule {}
