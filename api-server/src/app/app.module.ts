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
import { PurchasesModule } from './purchases/purchases.module';
import { StorefrontModule } from './storefront/storefront.module';
import { StorageModule } from './storage/storage.module';
import { DropshippingModule } from './dropshipping/dropshipping.module';
import { LogisticsModule } from './logistics/logistics.module';
import { SocialCommerceModule } from './social-commerce/social-commerce.module';
import { AutomationModule } from './automation/automation.module';
import { SupplierLedgerModule } from './suppliers/supplier-ledger.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { ReturnsModule } from './returns/returns.module';
import { MarketingModule } from './marketing/marketing.module';
import { RetailModule } from './retail/retail.module';

@Module({
  imports: [
    PrismaModule, 
    IamModule, 
    AuthModule, 
    SystemModule, 
    FinanceModule, 
    BusinessCoreModule, 
    OperationalStructureModule, 
    InventoryModule, 
    SalesModule, 
    FinanceIntegrationModule, 
    DesignStudioModule, 
    PurchasesModule, 
    StorefrontModule, 
    StorageModule,
    DropshippingModule,
    LogisticsModule,
    SocialCommerceModule,
    AutomationModule,
    SupplierLedgerModule,
    LoyaltyModule,
    ReturnsModule,
    MarketingModule,
    RetailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
