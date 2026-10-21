import { Module } from '@nestjs/common';
import { QuoteEngineService } from './quote-engine.service';
import { StorefrontService } from './storefront.service';
import { StorefrontController } from './storefront.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { BusinessCoreModule } from '../business-core/business-core.module';
import { StorageModule } from '../storage/storage.module';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [PrismaModule, BusinessCoreModule, StorageModule, SalesModule],
  controllers: [StorefrontController],
  providers: [QuoteEngineService, StorefrontService],
  exports: [QuoteEngineService, StorefrontService],
})
export class StorefrontModule {}
