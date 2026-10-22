import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { HybridIntelligenceService } from '../common/services/hybrid-intelligence.service';
import { BakiKhataController } from './baki-khata.controller';
import { BakiKhataService } from './baki-khata.service';
import { ServiceJobsController } from './service-jobs.controller';
import { ServiceJobsService } from './service-jobs.service';
import { WarrantyController } from './warranty.controller';
import { WarrantyService } from './warranty.service';
import { StaffCommissionsController } from './staff-commissions.controller';
import { StaffCommissionsService } from './staff-commissions.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    BakiKhataController,
    ServiceJobsController,
    WarrantyController,
    StaffCommissionsController,
  ],
  providers: [
    HybridIntelligenceService,
    BakiKhataService,
    ServiceJobsService,
    WarrantyService,
    StaffCommissionsService,
  ],
  exports: [
    BakiKhataService,
    ServiceJobsService,
    WarrantyService,
    StaffCommissionsService,
  ],
})
export class RetailModule {}
