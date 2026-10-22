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

// AI-Powered Internet Service Center Additions
import { ServiceKnowledgeService } from './service-knowledge.service';
import { PublicServicesController, AdminServiceKnowledgeController } from './service-knowledge.controller';
import { CustomerVaultService } from './customer-vault.service';
import {
  PublicCustomerVaultController,
  AdminCustomerVaultController,
  AuthenticatedCustomerVaultController,
} from './customer-vault.controller';
import { ServiceSchedulingService } from './service-scheduling.service';
import { PublicAppointmentsController, AdminServiceSchedulingController } from './service-scheduling.controller';
import { ServiceApplicationsService } from './service-applications.service';
import { PublicServiceRequestController, AdminServiceApplicationsController } from './service-applications.controller';
import { ServiceAssistantService } from './service-assistant.service';
import { PublicServiceAssistantController } from './service-assistant.controller';
import { NotificationService } from '../common/notifications/notification.service';
import { UniversalDocumentService } from './universal-document.service';
import { AdminUniversalDocumentController, PublicUniversalDocumentController } from './universal-document.controller';

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
    PublicServicesController,
    AdminServiceKnowledgeController,
    PublicCustomerVaultController,
    AuthenticatedCustomerVaultController,
    AdminCustomerVaultController,
    PublicAppointmentsController,
    AdminServiceSchedulingController,
    PublicServiceRequestController,
    AdminServiceApplicationsController,
    PublicServiceAssistantController,
    AdminUniversalDocumentController,
    PublicUniversalDocumentController,
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
    ServiceKnowledgeService,
    CustomerVaultService,
    ServiceSchedulingService,
    ServiceApplicationsService,
    ServiceAssistantService,
    NotificationService,
    UniversalDocumentService,
  ],
  exports: [
    BakiKhataService,
    ServiceJobsService,
    WarrantyService,
    StaffCommissionsService,
    PrintQueueService,
    DigitalServicesService,
    QuotationsService,
    NotificationService,
    UniversalDocumentService,
    MachineHealthService,
    AiCopilotService,
    HrPayrollService,
    BackupVaultService,
    ServiceKnowledgeService,
    CustomerVaultService,
    ServiceSchedulingService,
    ServiceApplicationsService,
    ServiceAssistantService,
  ],
})
export class RetailModule {}
