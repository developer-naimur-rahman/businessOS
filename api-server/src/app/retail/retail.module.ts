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

// Phase 12 Additions
import { PublicPrintDropController, AdminPrintQueueController } from './print-queue.controller';
import { PrintQueueService } from './print-queue.service';
import { PublicTrackerController } from './public-tracker.controller';
import { DigitalServicesController } from './digital-services.controller';
import { DigitalServicesService } from './digital-services.service';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';
import { MachineHealthController } from './machine-health.controller';
import { MachineHealthService } from './machine-health.service';
import { AiCopilotController } from './ai-copilot.controller';
import { AiCopilotService } from './ai-copilot.service';
import { HrPayrollController } from './hr-payroll.controller';
import { HrPayrollService } from './hr-payroll.service';
import { BackupVaultController } from './backup-vault.controller';
import { BackupVaultService } from './backup-vault.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    BakiKhataController,
    ServiceJobsController,
    WarrantyController,
    StaffCommissionsController,
    PublicPrintDropController,
    AdminPrintQueueController,
    PublicTrackerController,
    DigitalServicesController,
    QuotationsController,
    MachineHealthController,
    AiCopilotController,
    HrPayrollController,
    BackupVaultController,
  ],
  providers: [
    HybridIntelligenceService,
    BakiKhataService,
    ServiceJobsService,
    WarrantyService,
    StaffCommissionsService,
    PrintQueueService,
    DigitalServicesService,
    QuotationsService,
    MachineHealthService,
    AiCopilotService,
    HrPayrollService,
    BackupVaultService,
  ],
  exports: [
    BakiKhataService,
    ServiceJobsService,
    WarrantyService,
    StaffCommissionsService,
    PrintQueueService,
    DigitalServicesService,
    QuotationsService,
    MachineHealthService,
    AiCopilotService,
    HrPayrollService,
    BackupVaultService,
  ],
})
export class RetailModule {}
