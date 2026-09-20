import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { SalesRepository } from './sales.repository';
import { PrismaModule } from '../common/prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { BusinessCoreModule } from '../business-core/business-core.module';
import { OperationalStructureModule } from '../operational-structure/operational-structure.module';
import { FinanceIntegrationModule } from '../finance-integration/finance-integration.module';

import { CustomerSalesController } from './customer-sales.controller';

@Module({
  imports: [PrismaModule, InventoryModule, BusinessCoreModule, OperationalStructureModule, FinanceIntegrationModule],
  controllers: [SalesController, CustomerSalesController],
  providers: [SalesService, SalesRepository],
  exports: [SalesService],
})
export class SalesModule {}
