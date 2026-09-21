import { Module } from '@nestjs/common';
import { PurchasesController } from './controllers/purchases.controller';
import { PurchasesService } from './services/purchases.service';
import { PurchasesRepository } from './repositories/purchases.repository';
import { SystemModule } from '../system/system.module';
import { BusinessCoreModule } from '../business-core/business-core.module';
import { InventoryModule } from '../inventory/inventory.module';
import { OperationalStructureModule } from '../operational-structure/operational-structure.module';
import { FinanceIntegrationModule } from '../finance-integration/finance-integration.module';

@Module({
  imports: [
    SystemModule,
    BusinessCoreModule,
    InventoryModule,
    OperationalStructureModule,
    FinanceIntegrationModule,
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService, PurchasesRepository],
  exports: [PurchasesService],
})
export class PurchasesModule {}
