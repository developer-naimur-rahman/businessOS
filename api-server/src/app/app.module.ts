import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { IamModule } from './iam/iam.module';
import { SystemModule } from './system/system.module';
import { FinanceModule } from './finance/finance.module';
import { BusinessCoreModule } from './business-core/business-core.module';
import { OperationalStructureModule } from './operational-structure/operational-structure.module';
import { InventoryModule } from './inventory/inventory.module';
import { SalesModule } from './sales/sales.module';
import { FinanceIntegrationModule } from './finance-integration/finance-integration.module';
import { DesignStudioModule } from './design-studio/design-studio.module';

@Module({
  imports: [PrismaModule, IamModule, AuthModule, SystemModule, FinanceModule, BusinessCoreModule, OperationalStructureModule, InventoryModule, SalesModule, FinanceIntegrationModule, DesignStudioModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
