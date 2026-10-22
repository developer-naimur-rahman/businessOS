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
  sourceDocTitle?: string;
  confidence?: number; // 0.0 to 1.0
  isConflict?: boolean;
  conflictDetails?: string;
  verificationStatus?: 'EXTRACTED' | 'MANUAL_EDIT' | 'VERIFIED_BY_STAFF' | 'MISSING';
  originalExtractedValue?: string;
  isVerified?: boolean;
  verifiedByStaff?: string;
  verifiedAt?: string;
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
    extractedSummary?: string;
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
   * AI Multi-Document Extraction & Dynamic Form Mapping Adapter
   * Extracts values from all uploaded documents, maps them to the service's ordered fields,
   * detects conflicts, and attaches provenance.
   */
  async extractAndMapApplication(
    dto: {
      serviceSlug: string;
      documents: Array<{ id?: string; docType?: string; title?: string; fileUrl?: string; mimeType?: string; extractedText?: string }>;
      existingProfile?: any;
      organizationId?: string;
    }
  ): Promise<{
    serviceSlug: string;
    serviceTitleBn: string;
    extractedFields: ApplicationFieldValue[];
    conflictsDetected: Array<{ fieldKey: string; messageBn: string }>;
    overallConfidence: number;
    engineUsed: 'AI_GEMINI' | 'ALGORITHMIC_FALLBACK';
  }> {
    if (!dto?.serviceSlug) {
      throw new BadRequestException('serviceSlug is required');
    }

    let organizationId = dto.organizationId;
    if (!organizationId) {
      const org = await this.prisma.organization.findFirst();
      if (org) organizationId = org.id;
    }

    const serviceDef = await this.knowledgeService.getServiceBySlugOrId(dto.serviceSlug, organizationId);
    const orderedFields = serviceDef.orderedFields || [];
    const documents = Array.isArray(dto?.documents) ? dto.documents : [];

    // Document metadata and text summaries for prompt context
    const docSummaries = documents.map((d: any, i) => {
      const text = d.extractedText ? ` Text="${d.extractedText.slice(0, 500)}"` : '';
      return `Document #${i + 1}: Title="${d.title || 'Untitled'}", Type="${d.docType || 'DOCUMENT'}", Mime="${d.mimeType || 'unknown'}"${text}`;
    }).join('\n');

    const fieldsSchemaDescription = orderedFields.map(f =>
      `FieldKey: "${f.key}", Order: ${f.order}, LabelBn: "${f.labelBn}", LabelEn: "${f.labelEn}", Type: "${f.type}", Required: ${f.required}`
    ).join('\n');

    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
    let geminiSuccess = false;
    let geminiResult: any = null;

    if (geminiApiKey && geminiApiKey.length > 5 && !geminiApiKey.includes('placeholder') && documents.length > 0) {
      try {
        const prompt = `You are an expert OCR & identity document parser for Bangladesh citizen and government portals (Teletalk, BPSC, E-Passport, BDRIS, NID Wing, NBR TIN).
Target Service: "${serviceDef.titleBn}" (${serviceDef.titleEn})
Target Form Field Schema:
${fieldsSchemaDescription}

Uploaded Documents provided by citizen:
${docSummaries}

INSTRUCTIONS:
1. Extract the most accurate value for each field key from the uploaded documents.
2. For each field, specify:
   - "value": extracted string (e.g. name in English must be UPPERCASE, date of birth must be YYYY-MM-DD, NID/Birth registration number as clean digits). If not found, use empty string "".
   - "sourceDocTitle": the exact title of the document from which this value was found (or empty if missing).
   - "confidence": confidence score between 0.0 and 1.0 (e.g. 0.95 for clear text, 0.0 for missing).
   - "isConflict": true if different documents show differing values for this field (e.g. DOB or name spelling mismatch).
   - "conflictDetails": brief explanation in Bengali of the discrepancy if isConflict is true.
3. DO NOT invent or fabricate any value. If a field is not present in the documents, set value: "" and confidence: 0.0.

Respond strictly in JSON format (no markdown, no backticks):
{
  "fields": [
    {
      "key": "<fieldKey>",
      "value": "<extractedValue>",
      "sourceDocTitle": "<source document title>",
      "confidence": <number between 0.0 and 1.0>,
      "isConflict": <boolean>,
      "conflictDetails": "<Bengali explanation or null>"
    }
  ]
}`;

        const parts: any[] = [{ text: prompt }];

        // Attach actual visual documents for Gemini multimodal OCR
        for (const d of documents) {
          if (d.fileUrl && typeof d.fileUrl === 'string' && d.fileUrl.startsWith('data:')) {
            const match = d.fileUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              const mimeType = match[1]?.trim();
              const base64Data = match[2]?.trim();
              const isSupportedMime =
                mimeType.startsWith('image/') ||
                mimeType === 'application/pdf' ||
                mimeType === 'text/plain';

              // Limit inline payload per document to 15MB base64
              if (isSupportedMime && base64Data && base64Data.length > 20 && base64Data.length < 15 * 1024 * 1024) {
                parts.push({
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data,
                  },
                });
              }
            }
          }
        }

        const model = 'gemini-3.5-flash-lite';
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 18000);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
          }),
        });
        clearTimeout(timeout);

        if (res.ok) {
          const json = await res.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            try {
              geminiResult = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
              geminiSuccess = true;
            } catch (pErr) {
              this.logger.warn(`Failed to parse Gemini JSON output. Using algorithmic heuristics.`);
            }
          }
        } else {
          this.logger.warn(`Gemini API returned status ${res.status}. Falling back to Algorithmic Heuristics.`);
        }
      } catch (err: any) {
        this.logger.warn(`Gemini document mapping failed: ${err.message}. Falling back to Algorithmic Heuristics.`);
      }
    }

    // Combine extracted fields
    const conflicts: Array<{ fieldKey: string; messageBn: string }> = [];
    let totalConfidence = 0;

    const extractedFields: ApplicationFieldValue[] = orderedFields.map(f => {
      let val = '';
      let sourceTitle = '';
      let conf = 0;
      let conflict = false;
      let conflictDetail = '';
      let status: ApplicationFieldValue['verificationStatus'] = 'MISSING';

      // 1. Check if Gemini found it
      if (geminiSuccess && geminiResult?.fields) {
        const found = geminiResult.fields.find((gf: any) => gf.key === f.key);
        if (found && found.value && String(found.value).trim()) {
          val = String(found.value).trim();
          sourceTitle = found.sourceDocTitle || documents[0]?.title || 'Uploaded Document';
          conf = Number(found.confidence) || 0.85;
          conflict = !!found.isConflict;
          conflictDetail = found.conflictDetails || '';
          status = 'EXTRACTED';
        }
      }

      // 2. Algorithmic Fallback Heuristics if Gemini didn't extract this field
      if (!val && documents.length > 0) {
        const fullContent = documents.map((d: any) => `${d.title || ''} ${d.extractedText || ''}`).join(' ');

        if (f.key.toLowerCase().includes('nid') || f.key.toLowerCase().includes('reg')) {
          const nidMatch = fullContent.match(/\b(19\d{15}|20\d{15}|\d{17}|\d{13}|\d{10})\b/);
          if (nidMatch) {
            val = nidMatch[0];
            sourceTitle = documents[0]?.title || 'Uploaded Document';
            conf = 0.88;
            status = 'EXTRACTED';
          }
        } else if (f.key.toLowerCase().includes('dob') || f.key.toLowerCase().includes('birth')) {
          const dobMatch = fullContent.match(/\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})\b/);
          if (dobMatch) {
            val = dobMatch[0];
            sourceTitle = documents[0]?.title || 'Uploaded Document';
            conf = 0.85;
            status = 'EXTRACTED';
          }
        } else if (f.key === 'applicantNameEn') {
          const enMatch = fullContent.match(/Name:\s*([A-Za-z\s.]+)/i) || fullContent.match(/\b(MD\s+[A-Za-z\s]+)\b/);
          if (enMatch) {
            val = enMatch[1].trim().toUpperCase();
            sourceTitle = documents[0]?.title || 'Uploaded Document';
            conf = 0.82;
            status = 'EXTRACTED';
          }
        } else if (f.key === 'applicantNameBn') {
          const bnMatch = fullContent.match(/নাম:\s*([^\n,.]+)/) || fullContent.match(/মো:\s*([^\n,.]+)/);
          if (bnMatch) {
            val = (bnMatch[1] || bnMatch[0]).trim();
            sourceTitle = documents[0]?.title || 'Uploaded Document';
            conf = 0.82;
            status = 'EXTRACTED';
          }
        } else if (f.key === 'fatherNameEn' || f.key.toLowerCase().includes('father')) {
          const fatMatch = fullContent.match(/পিতা:\s*([^\n,.]+)/) || fullContent.match(/Father:\s*([A-Za-z\s.]+)/i);
          if (fatMatch) {
            val = fatMatch[1].trim();
            sourceTitle = documents[0]?.title || 'Uploaded Document';
            conf = 0.80;
            status = 'EXTRACTED';
          }
        } else if (f.key === 'motherNameEn' || f.key.toLowerCase().includes('mother')) {
          const motMatch = fullContent.match(/মাতা:\s*([^\n,.]+)/) || fullContent.match(/Mother:\s*([A-Za-z\s.]+)/i);
          if (motMatch) {
            val = motMatch[1].trim();
            sourceTitle = documents[0]?.title || 'Uploaded Document';
            conf = 0.80;
            status = 'EXTRACTED';
          }
        } else if (f.key.toLowerCase().includes('address')) {
          const addrMatch = fullContent.match(/ঠিকানা:\s*([^\n]+)/) || fullContent.match(/Address:\s*([^\n]+)/i);
          if (addrMatch) {
            val = addrMatch[1].trim();
            sourceTitle = documents[0]?.title || 'Uploaded Document';
            conf = 0.78;
            status = 'EXTRACTED';
          }
        }
      }

      // 3. Reusable Customer Vault Protection (Section 4 Requirement)
      // Never silently overwrite previously verified customer data with OCR.
      if (dto.existingProfile) {
        const p = dto.existingProfile;
        const vaultVal = p[f.key] || (f.key === 'applicantNameEn' ? p.nameEn : f.key === 'applicantNameBn' ? p.nameBn : f.key === 'dob' ? p.dob : f.key === 'nidNumber' ? p.nidNumber : '');
        if (vaultVal) {
          if (val && val !== vaultVal) {
            // Conflict between customer's saved verified profile and new document
            conflict = true;
            conflictDetail = `ভল্টে সংরক্ষিত পূর্বের তথ্য (${vaultVal}) এবং নতুন ডকুমেন্টের মানের মধ্যে অমিল রয়েছে।`;
            conflicts.push({ fieldKey: f.key, messageBn: conflictDetail });
          } else if (!val) {
            val = vaultVal;
            sourceTitle = 'Verified Customer Vault';
            conf = 1.0;
            status = 'VERIFIED_BY_STAFF';
          }
        }
      }

      if (conflict) {
        conflicts.push({ fieldKey: f.key, messageBn: conflictDetail || 'তথ্য গরমিল শনাক্ত হয়েছে।' });
      }

      totalConfidence += conf;

      return {
        key: f.key,
        labelBn: f.labelBn,
        labelEn: f.labelEn,
        value: val,
        order: f.order,
        sourceDocTitle: sourceTitle || undefined,
        confidence: conf,
        isConflict: conflict,
        conflictDetails: conflictDetail || undefined,
        verificationStatus: status,
        originalExtractedValue: val || undefined,
        isVerified: status === 'VERIFIED_BY_STAFF',
      };
    });

    const overallConfidence = orderedFields.length > 0 ? Math.round((totalConfidence / orderedFields.length) * 100) / 100 : 0.8;

    return {
      serviceSlug: serviceDef.slug,
      serviceTitleBn: serviceDef.titleBn,
      extractedFields,
      conflictsDetected: conflicts,
      overallConfidence,
      engineUsed: geminiSuccess ? 'AI_GEMINI' : 'ALGORITHMIC_FALLBACK',
    };
  }

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
      fieldValues?: Record<string, any> | ApplicationFieldValue[];
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
    let customerName = dto.customerName?.trim();
    if (!customerName && Array.isArray(dto.fieldValues)) {
      const en = dto.fieldValues.find(f => f.key === 'applicantNameEn')?.value;
      const bn = dto.fieldValues.find(f => f.key === 'applicantNameBn')?.value;
      customerName = en || bn || 'Applicant';
    }

    if (!customerName || !dto.customerPhone || !dto.serviceSlug) {
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

    // Build ordered field values with full provenance retention
    let orderedFieldValues: ApplicationFieldValue[] = [];

    if (Array.isArray(dto.fieldValues)) {
      // Already an array of ApplicationFieldValue from the Review & Correction step
      orderedFieldValues = dto.fieldValues.map((f, idx) => ({
        key: f.key,
        labelBn: f.labelBn,
        labelEn: f.labelEn,
        value: f.value !== undefined && f.value !== null ? String(f.value) : '',
        order: f.order || idx + 1,
        sourceDocId: f.sourceDocId,
        sourceDocTitle: f.sourceDocTitle,
        confidence: f.confidence !== undefined ? Number(f.confidence) : (f.value ? 0.9 : 0.0),
        isConflict: !!f.isConflict,
        conflictDetails: f.conflictDetails,
        verificationStatus: f.verificationStatus || (f.value ? 'EXTRACTED' : 'MISSING'),
        originalExtractedValue: f.originalExtractedValue || f.value,
        isVerified: !!f.isVerified,
      }));
    } else {
      // Key-value dictionary
      orderedFieldValues = (serviceDef.orderedFields || []).map(f => {
        const rawVal = dto.fieldValues ? dto.fieldValues[f.key] : '';
        return {
          key: f.key,
          labelBn: f.labelBn,
          labelEn: f.labelEn,
          value: rawVal !== undefined && rawVal !== null ? String(rawVal) : '',
          order: f.order,
          verificationStatus: rawVal ? 'EXTRACTED' : 'MISSING',
          isVerified: false,
        };
      });
    }

    const application: InternetServiceApplication = {
      id: `app-${Date.now()}`,
      referenceNumber,
      organizationId,
      serviceSlug: serviceDef.slug,
      serviceTitleBn: serviceDef.titleBn,
      serviceTitleEn: serviceDef.titleEn,
      customerName: customerName.trim(),
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
          notes: 'Customer submitted prepared application with verified documents & review.',
          author: customerName,
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
      const fieldMap: Record<string, string> = {};
      for (const f of orderedFieldValues) {
        fieldMap[f.key] = f.value;
      }

      await this.vaultService.upsertProfile(organizationId, null, {
        phone: dto.customerPhone,
        nameEn: customerName,
        nameBn: fieldMap['applicantNameBn'] || '',
        dob: fieldMap['dob'] || '',
        nidNumber: fieldMap['nidNumber'] || '',
        presentAddress: fieldMap['presentAddress'] || '',
        permanentAddress: fieldMap['permanentAddress'] || '',
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
      fields[idx] = {
        ...fields[idx],
        value: newValue,
        verificationStatus: 'MANUAL_EDIT',
        isVerified: true,
      };
    } else {
      fields.push({
        key: fieldKey,
        labelBn: fieldKey,
        labelEn: fieldKey,
        value: newValue,
        order: fields.length + 1,
        verificationStatus: 'MANUAL_EDIT',
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
   * Staff verifies an individual application field (Section 3 Requirement)
   */
  async verifyField(
    organizationId: string,
    userId: string | null,
    refOrId: string,
    fieldKey: string,
    isVerified: boolean,
    notes?: string
  ) {
    const current = await this.getApplicationByRef(organizationId, refOrId);
    const nowIso = new Date().toISOString();

    const fields = [...(current.fieldValues || [])];
    const idx = fields.findIndex(f => f.key === fieldKey);
    if (idx >= 0) {
      fields[idx] = {
        ...fields[idx],
        isVerified,
        verificationStatus: isVerified ? 'VERIFIED_BY_STAFF' : fields[idx].verificationStatus,
        verifiedByStaff: isVerified ? (userId || 'Staff') : undefined,
        verifiedAt: isVerified ? nowIso : undefined,
      };
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
        action: isVerified ? 'VERIFY_APPLICATION_FIELD' : 'UNVERIFY_APPLICATION_FIELD',
        oldData: current as any,
        newData: updated as any,
      },
    });

    return { success: true, fieldValues: fields };
  }

  /**
   * Staff resolves a detected conflict on a field (Section 3 Requirement)
   */
  async resolveConflict(
    organizationId: string,
    userId: string | null,
    refOrId: string,
    fieldKey: string,
    resolvedValue: string,
    resolutionNote: string
  ) {
    const current = await this.getApplicationByRef(organizationId, refOrId);
    const nowIso = new Date().toISOString();

    const fields = [...(current.fieldValues || [])];
    const idx = fields.findIndex(f => f.key === fieldKey);
    if (idx >= 0) {
      fields[idx] = {
        ...fields[idx],
        value: resolvedValue,
        isConflict: false,
        conflictDetails: undefined,
        verificationStatus: 'VERIFIED_BY_STAFF',
        isVerified: true,
        verifiedByStaff: userId || 'Staff',
        verifiedAt: nowIso,
      };
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
        action: 'RESOLVE_FIELD_CONFLICT',
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
