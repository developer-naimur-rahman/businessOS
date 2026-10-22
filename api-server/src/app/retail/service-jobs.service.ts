import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationService } from '../common/notifications/notification.service';

export interface CreateServiceJobDto {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceCategory: 'PRINTING_PRESS' | 'PC_LAPTOP_REPAIR' | 'PHOTO_VIDEO_EDIT' | 'CUSTOM_DESIGN' | 'OTHER_SERVICE';
  jobDescription: string;
  deviceOrFileDetails?: string;
  estimatedCostBdt: number;
  advancePaidBdt?: number;
  assignedStaffName?: string;
  promisedDeliveryDate?: string;
}

export interface UpdateJobStatusDto {
  status: 'RECEIVED' | 'IN_PROGRESS' | 'WAITING_FOR_PARTS' | 'READY_FOR_DELIVERY' | 'DELIVERED';
  notes?: string;
  finalPaidAmount?: number;
}

@Injectable()
export class ServiceJobsService {
  private readonly logger = new Logger(ServiceJobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly notificationService?: NotificationService,
  ) {}

  async createJob(organizationId: string, userId: string | null, dto: CreateServiceJobDto) {
    const jobNumber = `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const estCost = Number(dto.estimatedCostBdt) || 0;
    const advance = Number(dto.advancePaidBdt) || 0;
    const due = Math.max(0, estCost - advance);

    const jobData = {
      jobNumber,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail?.trim() || undefined,
      serviceCategory: dto.serviceCategory,
      jobDescription: dto.jobDescription,
      deviceOrFileDetails: dto.deviceOrFileDetails || '',
      estimatedCostBdt: estCost,
      advancePaidBdt: advance,
      dueAmountBdt: due,
      assignedStaffName: dto.assignedStaffName || 'Desk Operator',
      promisedDeliveryDate: dto.promisedDeliveryDate || new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      status: 'RECEIVED',
      statusHistory: [
        {
          status: 'RECEIVED',
          timestamp: new Date().toISOString(),
          notes: 'Job token created and device/files received at desk',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    const log = await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'ServiceJobTicket',
        entityId: jobNumber,
        action: 'CREATE_JOB_TICKET',
        newData: jobData,
      },
    });

    if (jobData.customerEmail && this.notificationService) {
      this.notificationService.notifyServiceJobUpdate({
        jobNumber,
        customerName: jobData.customerName,
        customerEmail: jobData.customerEmail,
        customerPhone: jobData.customerPhone,
        status: 'RECEIVED',
        estimatedCostBdt: jobData.estimatedCostBdt,
        dueAmountBdt: jobData.dueAmountBdt,
        serviceCategory: jobData.serviceCategory,
        notes: `Job ticket created. Promised by ${new Date(jobData.promisedDeliveryDate).toLocaleDateString()}`,
      }).catch((e) => this.logger.warn(`Failed to dispatch initial job email: ${e.message}`));
    }

    return {
      success: true,
      id: log.id,
      jobNumber,
      job: jobData,
    };
  }

  async getJobs(organizationId: string, statusFilter?: string, search?: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'ServiceJobTicket',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    let jobs = logs.map((l) => {
      const d = (l.newData as any) || {};
      return {
        id: l.id,
        ...d,
        createdAt: l.createdAt.toISOString(),
      };
    });

    if (statusFilter && statusFilter !== 'ALL') {
      jobs = jobs.filter((j) => j.status === statusFilter);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      jobs = jobs.filter(
        (j) =>
          (j.jobNumber && j.jobNumber.toLowerCase().includes(q)) ||
          (j.customerName && j.customerName.toLowerCase().includes(q)) ||
          (j.customerPhone && j.customerPhone.includes(q)) ||
          (j.jobDescription && j.jobDescription.toLowerCase().includes(q))
      );
    }

    // Calculate metrics
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((j) => ['RECEIVED', 'IN_PROGRESS', 'WAITING_FOR_PARTS'].includes(j.status)).length;
    const readyForDelivery = jobs.filter((j) => j.status === 'READY_FOR_DELIVERY').length;
    const totalDuePending = jobs.reduce((acc, j) => acc + (j.status !== 'DELIVERED' ? Number(j.dueAmountBdt || 0) : 0), 0);

    return {
      metrics: {
        totalJobs,
        activeJobs,
        readyForDelivery,
        totalDuePendingBdt: totalDuePending,
      },
      jobs,
    };
  }

  async updateJobStatus(organizationId: string, userId: string | null, idOrJobNumber: string, dto: UpdateJobStatusDto) {
    const log = await this.prisma.auditLog.findFirst({
      where: {
        organizationId,
        entityType: 'ServiceJobTicket',
        OR: [{ id: idOrJobNumber }, { entityId: idOrJobNumber }],
      },
    });

    if (!log) {
      throw new NotFoundException('Service Job ticket not found');
    }

    const currentData = (log.newData as any) || {};
    const oldHistory = Array.isArray(currentData.statusHistory) ? currentData.statusHistory : [];

    const newHistoryEntry = {
      status: dto.status,
      timestamp: new Date().toISOString(),
      notes: dto.notes || `Status changed to ${dto.status}`,
    };

    let updatedDue = currentData.dueAmountBdt;
    if (dto.status === 'DELIVERED' && dto.finalPaidAmount !== undefined) {
      updatedDue = Math.max(0, updatedDue - dto.finalPaidAmount);
    } else if (dto.status === 'DELIVERED') {
      updatedDue = 0; // Cleared on delivery
    }

    const updatedJob = {
      ...currentData,
      status: dto.status,
      dueAmountBdt: updatedDue,
      statusHistory: [...oldHistory, newHistoryEntry],
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.auditLog.update({
      where: { id: log.id },
      data: {
        action: `UPDATE_STATUS_${dto.status}`,
        newData: updatedJob,
      },
    });

    // Auto-generate notification text if ready
    let customerReadySms = '';
    let whatsappUrl = '';
    if (dto.status === 'READY_FOR_DELIVERY') {
      const phone = currentData.customerPhone ? currentData.customerPhone.replace(/[^0-9]/g, '') : '';
      customerReadySms = `প্রিয় ${currentData.customerName}, আপনার অর্ডার #${currentData.jobNumber} রেডি হয়েছে। শপ থেকে সংগ্রহ করার জন্য অনুরোধ করা হচ্ছে। বাকি টাকা: ৳${updatedDue}। ধন্যবাদ।`;
      whatsappUrl = `https://wa.me/88${phone.startsWith('88') ? phone.slice(2) : phone}?text=${encodeURIComponent(customerReadySms)}`;
    }

    if (currentData.customerEmail && this.notificationService) {
      this.notificationService.notifyServiceJobUpdate({
        jobNumber: currentData.jobNumber,
        customerName: currentData.customerName,
        customerEmail: currentData.customerEmail,
        customerPhone: currentData.customerPhone,
        status: dto.status,
        estimatedCostBdt: currentData.estimatedCostBdt,
        dueAmountBdt: updatedDue,
        serviceCategory: currentData.serviceCategory,
        notes: dto.notes,
      }).catch((e) => this.logger.warn(`Failed to dispatch status email: ${e.message}`));
    }

    return {
      success: true,
      jobNumber: currentData.jobNumber,
      status: dto.status,
      customerReadySms,
      whatsappUrl,
      job: updatedJob,
    };
  }
}
