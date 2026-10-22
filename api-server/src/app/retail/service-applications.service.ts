import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ServiceKnowledgeService } from './service-knowledge.service';
import { CustomerVaultService } from './customer-vault.service';

export interface ApplicationFieldValue {
  key: string;
  labelBn: string;
  labelEn: string;
  value: string;
  order: number;
  sourceDocId?: string;
  isVerified?: boolean;
}

export interface ApplicationDeliverable {
  id: string;
  title: string;
  fileUrl: string;
  type: 'CONFIRMATION_SLIP' | 'ADMIT_CARD' | 'RESIZED_PHOTO' | 'CERTIFICATE' | 'OTHER';
  uploadedAt: string;
}

export interface InternetServiceApplication {
  id: string;
  referenceNumber: string; // e.g. ISC-2026-1042
  organizationId: string;
  serviceSlug: string;
  serviceTitleBn: string;
  serviceTitleEn: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fieldValues: ApplicationFieldValue[];
  uploadedDocuments: Array<{
    id: string;
    docType: string;
    title: string;
    fileUrl: string;
    mimeType: string;
  }>;
  voiceNoteUrl?: string;
  voiceTranscript?: string;
  customerNotes?: string;
  financials: {
    officialGovtFeeBdt: number;
    shopServiceChargeBdt: number;
    printingOrAddonBdt: number;
    totalAmountBdt: number;
    advancePaidBdt: number;
    dueAmountBdt: number;
  };
  paymentEvidence?: {
    paymentMethod: 'BKASH' | 'NAGAD' | 'CASH_AT_COUNTER' | 'OTHER';
    transactionId?: string;
    screenshotUrl?: string;
    submittedAmountBdt: number;
    paymentStatus: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
    verifiedAmountBdt?: number;
    verifiedAt?: string;
    verifiedBy?: string;
    verificationNotes?: string;
  };
  deliveryMode: 'ONLINE_DOWNLOAD' | 'SHOP_PICKUP' | 'COURIER';
  deliveryAddress?: string;
  appointmentToken?: string;
  status:
    | 'DRAFT'
    | 'AWAITING_CUSTOMER_INFO'
    | 'AWAITING_PAYMENT'
    | 'SUBMITTED_FOR_REVIEW'
    | 'DOCUMENTS_VERIFIED'
    | 'READY_FOR_PROCESSING'
    | 'IN_PROGRESS'
    | 'AWAITING_OFFICIAL_SUBMISSION'
    | 'SUBMITTED_TO_AUTHORITY'
    | 'READY_FOR_APPROVAL'
    | 'COMPLETED'
    | 'READY_FOR_PICKUP'
    | 'DELIVERED'
    | 'CANCELLED';
  missingDocuments?: string[];
  customerApprovedAt?: string;
  customerApprovalNotes?: string;
  assignedStaffName?: string;
  deliverables: ApplicationDeliverable[];
  statusHistory: Array<{
    status: string;
    timestamp: string;
    notes?: string;
    author?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ServiceApplicationsService {
  private readonly logger = new Logger(ServiceApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledgeService: ServiceKnowledgeService,
    private readonly vaultService: CustomerVaultService
  ) {}

  /**
   * Customer submits service intake request
   */
  async submitApplication(
    dto: {
      organizationId?: string;
      serviceSlug: string;
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      fieldValues?: Record<string, any>;
      uploadedDocuments?: any[];
      voiceNoteUrl?: string;
      voiceTranscript?: string;
      customerNotes?: string;
      paymentMethod?: 'BKASH' | 'NAGAD' | 'CASH_AT_COUNTER' | 'OTHER';
      transactionId?: string;
      paymentScreenshotUrl?: string;
      paidAmountBdt?: number;
      deliveryMode?: 'ONLINE_DOWNLOAD' | 'SHOP_PICKUP' | 'COURIER';
      deliveryAddress?: string;
      appointmentToken?: string;
    }
  ): Promise<InternetServiceApplication> {
    if (!dto.customerName || !dto.customerPhone || !dto.serviceSlug) {
      throw new BadRequestException('Customer name, phone number, and service selection are required.');
    }

    let organizationId = dto.organizationId;
    if (!organizationId) {
      const org = await this.prisma.organization.findFirst();
      if (!org) throw new NotFoundException('Organization not configured.');
      organizationId = org.id;
    }

    // Retrieve service definition from knowledge base for fee & ordered field defaults
    const serviceDef = await this.knowledgeService.getServiceBySlugOrId(dto.serviceSlug, organizationId);

    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const referenceNumber = `ISC-${year}-${rand}`;
    const nowIso = new Date().toISOString();

    // Calculate financials: Govt Fee + Shop Charge + Addon
    const govtFee = Number(serviceDef.officialGovtFeeBdt || 0);
    const shopFee = Number(serviceDef.shopServiceChargeBdt || 0);
    const printingAddon = dto.deliveryMode === 'SHOP_PICKUP' || dto.deliveryMode === 'COURIER' ? 40 : 0;
    const totalAmount = govtFee + shopFee + printingAddon;
    const submittedPay = Number(dto.paidAmountBdt || 0);
    const due = Math.max(0, totalAmount - submittedPay);

    // Build ordered field values
    const orderedFieldValues: ApplicationFieldValue[] = (serviceDef.orderedFields || []).map(f => {
      const rawVal = dto.fieldValues ? dto.fieldValues[f.key] : '';
      return {
        key: f.key,
        labelBn: f.labelBn,
        labelEn: f.labelEn,
        value: rawVal !== undefined && rawVal !== null ? String(rawVal) : '',
        order: f.order,
        isVerified: false,
      };
    });

    const application: InternetServiceApplication = {
      id: `app-${Date.now()}`,
      referenceNumber,
      organizationId,
      serviceSlug: serviceDef.slug,
      serviceTitleBn: serviceDef.titleBn,
      serviceTitleEn: serviceDef.titleEn,
      customerName: dto.customerName.trim(),
      customerPhone: dto.customerPhone.trim(),
      customerEmail: dto.customerEmail?.trim(),
      fieldValues: orderedFieldValues,
      uploadedDocuments: (dto.uploadedDocuments || []).map((d, idx) => ({
        id: d.id || `doc-${idx + 1}`,
        docType: d.docType || 'SUPPORTING_DOC',
        title: d.title || d.name || `Document ${idx + 1}`,
        fileUrl: d.fileUrl || d.url || '',
        mimeType: d.mimeType || 'application/octet-stream',
      })),
      voiceNoteUrl: dto.voiceNoteUrl,
      voiceTranscript: dto.voiceTranscript,
      customerNotes: dto.customerNotes || '',
      financials: {
        officialGovtFeeBdt: govtFee,
        shopServiceChargeBdt: shopFee,
        printingOrAddonBdt: printingAddon,
        totalAmountBdt: totalAmount,
        advancePaidBdt: submittedPay,
        dueAmountBdt: due,
      },
      paymentEvidence: dto.paymentMethod ? {
        paymentMethod: dto.paymentMethod,
        transactionId: dto.transactionId?.trim(),
        screenshotUrl: dto.paymentScreenshotUrl,
        submittedAmountBdt: submittedPay,
        paymentStatus: 'PENDING_VERIFICATION',
      } : undefined,
      deliveryMode: dto.deliveryMode || 'ONLINE_DOWNLOAD',
      deliveryAddress: dto.deliveryAddress,
      appointmentToken: dto.appointmentToken,
      status: 'SUBMITTED_FOR_REVIEW',
      deliverables: [],
      statusHistory: [
        {
          status: 'SUBMITTED_FOR_REVIEW',
          timestamp: nowIso,
          notes: 'Customer submitted online request with initial documents & details.',
          author: dto.customerName,
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Store in AuditLog with entityType='InternetServiceApplication'
    await this.prisma.auditLog.create({
      data: {
        organizationId,
        entityType: 'InternetServiceApplication',
        entityId: referenceNumber,
        action: 'SUBMIT_SERVICE_APPLICATION',
        newData: application as any,
      },
    });

    // Also link/save to Customer Vault for future reusability
    try {
      await this.vaultService.upsertProfile(organizationId, null, {
        phone: dto.customerPhone,
        nameEn: dto.customerName,
        nameBn: (dto.fieldValues?.applicantNameBn as string) || '',
        dob: (dto.fieldValues?.dob as string) || '',
        nidNumber: (dto.fieldValues?.nidNumber as string) || '',
        presentAddress: (dto.fieldValues?.presentAddress as string) || '',
        permanentAddress: (dto.fieldValues?.permanentAddress as string) || '',
      });
    } catch (err: any) {
      this.logger.warn(`Could not auto-sync customer vault: ${err.message}`);
    }

    return application;
  }

  /**
   * Get applications for admin pipeline
   */
  async getApplications(organizationId: string, statusFilter?: string, search?: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'InternetServiceApplication',
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // De-duplicate: Keep only the latest log for each application entityId
    const appMap = new Map<string, InternetServiceApplication>();
    for (const log of logs) {
      const ref = log.entityId;
      if (!appMap.has(ref) && log.newData) {
        appMap.set(ref, (log.newData as any) as InternetServiceApplication);
      }
    }

    let list = Array.from(appMap.values());

    if (statusFilter && statusFilter !== 'ALL') {
      list = list.filter(a => a.status === statusFilter);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a =>
        a.referenceNumber?.toLowerCase().includes(q) ||
        a.customerName?.toLowerCase().includes(q) ||
        a.customerPhone?.includes(q) ||
        a.serviceTitleBn?.toLowerCase().includes(q) ||
        a.serviceTitleEn?.toLowerCase().includes(q)
      );
    }

    return list;
  }

  /**
   * Get single application by reference number or ID
   */
  async getApplicationByRef(organizationId: string, refOrId: string): Promise<InternetServiceApplication> {
    const log = await this.prisma.auditLog.findFirst({
      where: {
        organizationId,
        entityType: 'InternetServiceApplication',
        entityId: refOrId,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!log || !log.newData) {
      throw new NotFoundException(`Service application '${refOrId}' not found.`);
    }

    return (log.newData as any) as InternetServiceApplication;
  }

  /**
   * Update application status and log history
   */
  async updateStatus(
    organizationId: string,
    userId: string | null,
    refOrId: string,
    newStatus: InternetServiceApplication['status'],
    notes?: string,
    assignedStaffName?: string
  ) {
    const current = await this.getApplicationByRef(organizationId, refOrId);
    const nowIso = new Date().toISOString();

    const updatedHistory = [
      ...(current.statusHistory || []),
      {
        status: newStatus,
        timestamp: nowIso,
        notes: notes || `Status changed to ${newStatus}`,
        author: assignedStaffName || 'Staff Operator',
      },
    ];

    const updated: InternetServiceApplication = {
      ...current,
      status: newStatus,
      assignedStaffName: assignedStaffName || current.assignedStaffName,
      statusHistory: updatedHistory,
      updatedAt: nowIso,
    };

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'InternetServiceApplication',
        entityId: current.referenceNumber,
        action: `APPLICATION_STATUS_${newStatus}`,
        oldData: current as any,
        newData: updated as any,
      },
    });

    return { success: true, application: updated };
  }

  /**
   * Verify customer payment evidence
   */
  async verifyPayment(
    organizationId: string,
    userId: string | null,
    refOrId: string,
    paymentStatus: 'VERIFIED' | 'REJECTED',
    verifiedAmountBdt?: number,
    notes?: string
  ) {
    const current = await this.getApplicationByRef(organizationId, refOrId);
    const nowIso = new Date().toISOString();
    const verifiedAmount = Number(verifiedAmountBdt || current.paymentEvidence?.submittedAmountBdt || 0);

    const updatedEvidence = {
      ...(current.paymentEvidence || {
        paymentMethod: 'OTHER' as const,
        submittedAmountBdt: verifiedAmount,
      }),
      paymentStatus,
      verifiedAmountBdt: paymentStatus === 'VERIFIED' ? verifiedAmount : 0,
      verifiedAt: nowIso,
      verifiedBy: userId || 'Staff Operator',
      verificationNotes: notes || '',
    };

    const newAdvance = paymentStatus === 'VERIFIED' ? verifiedAmount : 0;
    const newDue = Math.max(0, current.financials.totalAmountBdt - newAdvance);

    const updated: InternetServiceApplication = {
      ...current,
      financials: {
        ...current.financials,
        advancePaidBdt: newAdvance,
        dueAmountBdt: newDue,
      },
      paymentEvidence: updatedEvidence,
      status: paymentStatus === 'VERIFIED' && current.status === 'AWAITING_PAYMENT' ? 'READY_FOR_PROCESSING' : current.status,
      updatedAt: nowIso,
    };

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'InternetServiceApplication',
        entityId: current.referenceNumber,
        action: `PAYMENT_${paymentStatus}`,
        oldData: current as any,
        newData: updated as any,
      },
    });

    return { success: true, application: updated };
  }

  /**
   * Update individual field value (Staff Ordered Field preparation)
   */
  async updateFieldValue(
    organizationId: string,
    userId: string | null,
    refOrId: string,
    fieldKey: string,
    newValue: string
  ) {
    const current = await this.getApplicationByRef(organizationId, refOrId);
    const nowIso = new Date().toISOString();

    const fields = [...(current.fieldValues || [])];
    const idx = fields.findIndex(f => f.key === fieldKey);
    if (idx >= 0) {
      fields[idx] = { ...fields[idx], value: newValue, isVerified: true };
    } else {
      fields.push({
        key: fieldKey,
        labelBn: fieldKey,
        labelEn: fieldKey,
        value: newValue,
        order: fields.length + 1,
        isVerified: true,
      });
    }

    const updated: InternetServiceApplication = {
      ...current,
      fieldValues: fields,
      updatedAt: nowIso,
    };

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'InternetServiceApplication',
        entityId: current.referenceNumber,
        action: 'UPDATE_FIELD_VALUE',
        oldData: current as any,
        newData: updated as any,
      },
    });

    return { success: true, fieldValues: fields };
  }

  /**
   * Upload completed deliverable (Confirmation slip, Admit card, etc.)
   */
  async addDeliverable(
    organizationId: string,
    userId: string | null,
    refOrId: string,
    deliverable: {
      title: string;
      fileUrl: string;
      type: ApplicationDeliverable['type'];
    }
  ) {
    const current = await this.getApplicationByRef(organizationId, refOrId);
    const nowIso = new Date().toISOString();

    const newDeliverable: ApplicationDeliverable = {
      id: `deliv-${Date.now()}`,
      title: deliverable.title,
      fileUrl: deliverable.fileUrl,
      type: deliverable.type,
      uploadedAt: nowIso,
    };

    const deliverables = [...(current.deliverables || []), newDeliverable];
    const updated: InternetServiceApplication = {
      ...current,
      deliverables,
      status: current.status !== 'DELIVERED' ? 'READY_FOR_APPROVAL' : current.status,
      updatedAt: nowIso,
    };

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'InternetServiceApplication',
        entityId: current.referenceNumber,
        action: 'ADD_DELIVERABLE',
        oldData: current as any,
        newData: updated as any,
      },
    });

    return { success: true, deliverable: newDeliverable, deliverables };
  }

  /**
   * Customer approves prepared draft
   */
  async customerApproveDraft(refNumber: string, customerApprovalNotes?: string) {
    const org = await this.prisma.organization.findFirst();
    if (!org) throw new NotFoundException('Organization not found.');

    const current = await this.getApplicationByRef(org.id, refNumber);
    const nowIso = new Date().toISOString();

    const updated: InternetServiceApplication = {
      ...current,
      customerApprovedAt: nowIso,
      customerApprovalNotes: customerApprovalNotes || 'Customer approved the prepared draft.',
      status: 'COMPLETED',
      statusHistory: [
        ...(current.statusHistory || []),
        {
          status: 'COMPLETED',
          timestamp: nowIso,
          notes: 'Customer verified and approved prepared draft.',
          author: current.customerName,
        },
      ],
      updatedAt: nowIso,
    };

    await this.prisma.auditLog.create({
      data: {
        organizationId: org.id,
        entityType: 'InternetServiceApplication',
        entityId: current.referenceNumber,
        action: 'CUSTOMER_APPROVE_DRAFT',
        oldData: current as any,
        newData: updated as any,
      },
    });

    return { success: true, application: updated };
  }
}
