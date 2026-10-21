import { Module } from '@nestjs/common';
import { DropshippingController } from './dropshipping.controller';
import { DropshippingService } from './dropshipping.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { HybridIntelligenceService } from '../common/services/hybrid-intelligence.service';

@Module({
  imports: [PrismaModule],
  controllers: [DropshippingController],
  providers: [DropshippingService, HybridIntelligenceService],
  exports: [DropshippingService, HybridIntelligenceService],
})
export class DropshippingModule {}

