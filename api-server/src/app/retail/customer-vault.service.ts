import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { HybridIntelligenceService } from '../common/services/hybrid-intelligence.service';

export interface EducationEntry {
  degree: 'SSC' | 'HSC' | 'GRADUATION' | 'POST_GRADUATION' | 'OTHER';
  examTitle: string;
  boardOrUniversity: string;
  rollNumber?: string;
  regNumber?: string;
  passingYear: string;
  resultGpa: string;
}

export interface CustomerVaultItem {
  id: string;
  docType: 'PHOTO' | 'SIGNATURE' | 'NID' | 'BIRTH_CERTIFICATE' | 'ACADEMIC_CERT' | 'TRADE_LICENSE' | 'CITIZEN_CERT' | 'OTHER';
  title: string;
  fileUrlOrBase64: string;
  mimeType: string;
  sizeBytes?: number;
  uploadedAt: string;
  isVerified: boolean;
  extractedTextPreview?: string;
}

export interface DynamicCustomerField {
  id: string;
  key: string;              // Canonical key e.g. "graduation_cgpa", "passport_expiry"
  labelBn: string;
  labelEn: string;
  category: 'IDENTITY' | 'EDUCATION' | 'EMPLOYMENT' | 'PASSPORT' | 'BUSINESS' | 'TAX' | 'CONTACT' | 'OTHER';
  fieldType: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'FILE' | 'BOOLEAN';
  value: any;
  sourceDocId?: string;
  sourceDocName?: string;
  confidence?: number;
  status: 'SUGGESTED' | 'REVIEWED' | 'VERIFIED' | 'REJECTED';
  isConflicting?: boolean;
  conflictingValues?: { value: any; source: string; timestamp: string }[];
  verifiedBy?: string;
  verifiedAt?: string;
  updatedAt: string;
}

export interface CustomerVaultProfile {
  id: string;
  customerId?: string; // Prisma Customer ID linkage
  organizationId: string;
  phone: string;
  email?: string;
  nameBn: string;
  nameEn: string;
  fatherNameBn?: string;
  fatherNameEn?: string;
  motherNameBn?: string;
  motherNameEn?: string;
  dob: string; // YYYY-MM-DD
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  nidNumber?: string;
  birthRegNumber?: string;
  presentAddress: string;
  permanentAddress: string;
  educationHistory: EducationEntry[];
  documents: CustomerVaultItem[];
  dynamicFields: DynamicCustomerField[];
  photoUrl?: string;
  signatureUrl?: string;
  consentRecord: {
    consentGiven: boolean;
    consentGivenAt: string;
    purposeBn: string;
    aiProcessingConsented: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export const CANONICAL_FIELD_MAP: Record<string, { canonicalKey: string; labelEn: string; labelBn: string; category: DynamicCustomerField['category']; fieldType: DynamicCustomerField['fieldType'] }> = {
  // DOB synonyms
  'dob': { canonicalKey: 'dob', labelEn: 'Date of Birth', labelBn: 'জন্মতারিখ', category: 'IDENTITY', fieldType: 'DATE' },
  'date_of_birth': { canonicalKey: 'dob', labelEn: 'Date of Birth', labelBn: 'জন্মতারিখ', category: 'IDENTITY', fieldType: 'DATE' },
  'dateofbirth': { canonicalKey: 'dob', labelEn: 'Date of Birth', labelBn: 'জন্মতারিখ', category: 'IDENTITY', fieldType: 'DATE' },
  'জন্মতারিখ': { canonicalKey: 'dob', labelEn: 'Date of Birth', labelBn: 'জন্মতারিখ', category: 'IDENTITY', fieldType: 'DATE' },
  'birth_date': { canonicalKey: 'dob', labelEn: 'Date of Birth', labelBn: 'জন্মতারিখ', category: 'IDENTITY', fieldType: 'DATE' },
  // NID synonyms
  'nid': { canonicalKey: 'nidNumber', labelEn: 'National ID Number', labelBn: 'জাতীয় পরিচয়পত্র নম্বর', category: 'IDENTITY', fieldType: 'TEXT' },
  'nid_number': { canonicalKey: 'nidNumber', labelEn: 'National ID Number', labelBn: 'জাতীয় পরিচয়পত্র নম্বর', category: 'IDENTITY', fieldType: 'TEXT' },
  'nidnumber': { canonicalKey: 'nidNumber', labelEn: 'National ID Number', labelBn: 'জাতীয় পরিচয়পত্র নম্বর', category: 'IDENTITY', fieldType: 'TEXT' },
  'জাতীয় পরিচয়পত্র': { canonicalKey: 'nidNumber', labelEn: 'National ID Number', labelBn: 'জাতীয় পরিচয়পত্র নম্বর', category: 'IDENTITY', fieldType: 'TEXT' },
  // Passport
  'passport_no': { canonicalKey: 'passport_number', labelEn: 'Passport Number', labelBn: 'পাসপোর্ট নম্বর', category: 'PASSPORT', fieldType: 'TEXT' },
  'passport_number': { canonicalKey: 'passport_number', labelEn: 'Passport Number', labelBn: 'পাসপোর্ট নম্বর', category: 'PASSPORT', fieldType: 'TEXT' },
  'passport_expiry': { canonicalKey: 'passport_expiry_date', labelEn: 'Passport Expiry Date', labelBn: 'পাসপোর্টের মেয়াদ উত্তীর্ণের তারিখ', category: 'PASSPORT', fieldType: 'DATE' },
  'passport_issue': { canonicalKey: 'passport_issue_date', labelEn: 'Passport Issue Date', labelBn: 'পাসপোর্ট প্রদানের তারিখ', category: 'PASSPORT', fieldType: 'DATE' },
  // Education
  'passing_year': { canonicalKey: 'passing_year', labelEn: 'Passing Year', labelBn: 'পাসের সন', category: 'EDUCATION', fieldType: 'TEXT' },
  'roll': { canonicalKey: 'roll_number', labelEn: 'Roll Number', labelBn: 'রোল নম্বর', category: 'EDUCATION', fieldType: 'TEXT' },
  'roll_number': { canonicalKey: 'roll_number', labelEn: 'Roll Number', labelBn: 'রোল নম্বর', category: 'EDUCATION', fieldType: 'TEXT' },
  'reg_no': { canonicalKey: 'reg_number', labelEn: 'Registration Number', labelBn: 'রেজিস্ট্রেশন নম্বর', category: 'EDUCATION', fieldType: 'TEXT' },
  'reg_number': { canonicalKey: 'reg_number', labelEn: 'Registration Number', labelBn: 'রেজিস্ট্রেশন নম্বর', category: 'EDUCATION', fieldType: 'TEXT' },
  'cgpa': { canonicalKey: 'result_cgpa', labelEn: 'Result / CGPA', labelBn: 'ফলাফল / জিপিএ', category: 'EDUCATION', fieldType: 'TEXT' },
  'gpa': { canonicalKey: 'result_cgpa', labelEn: 'Result / CGPA', labelBn: 'ফলাফল / জিপিএ', category: 'EDUCATION', fieldType: 'TEXT' },
  'result_cgpa': { canonicalKey: 'result_cgpa', labelEn: 'Result / CGPA', labelBn: 'ফলাফল / জিপিএ', category: 'EDUCATION', fieldType: 'TEXT' },
  'board': { canonicalKey: 'education_board', labelEn: 'Education Board', labelBn: 'শিক্ষা বোর্ড', category: 'EDUCATION', fieldType: 'TEXT' },
  'education_board': { canonicalKey: 'education_board', labelEn: 'Education Board', labelBn: 'শিক্ষা বোর্ড', category: 'EDUCATION', fieldType: 'TEXT' },
  // Employment
  'employer': { canonicalKey: 'employer_name', labelEn: 'Employer / Organization', labelBn: 'প্রতিষ্ঠানের নাম', category: 'EMPLOYMENT', fieldType: 'TEXT' },
  'employer_name': { canonicalKey: 'employer_name', labelEn: 'Employer / Organization', labelBn: 'প্রতিষ্ঠানের নাম', category: 'EMPLOYMENT', fieldType: 'TEXT' },
  'designation': { canonicalKey: 'designation', labelEn: 'Designation / Job Title', labelBn: 'পদবী', category: 'EMPLOYMENT', fieldType: 'TEXT' },
  'experience_years': { canonicalKey: 'experience_years', labelEn: 'Experience (Years)', labelBn: 'অভিজ্ঞতা (বছর)', category: 'EMPLOYMENT', fieldType: 'NUMBER' },
  // Business & Tax
  'trade_license': { canonicalKey: 'trade_license_no', labelEn: 'Trade License Number', labelBn: 'ট্রেড লাইসেন্স নম্বর', category: 'BUSINESS', fieldType: 'TEXT' },
  'trade_license_no': { canonicalKey: 'trade_license_no', labelEn: 'Trade License Number', labelBn: 'ট্রেড লাইসেন্স নম্বর', category: 'BUSINESS', fieldType: 'TEXT' },
  'tin': { canonicalKey: 'tin_number', labelEn: 'TIN / Tax ID Number', labelBn: 'টিআইএন নম্বর', category: 'TAX', fieldType: 'TEXT' },
  'tin_number': { canonicalKey: 'tin_number', labelEn: 'TIN / Tax ID Number', labelBn: 'টিআইএন নম্বর', category: 'TAX', fieldType: 'TEXT' },
};

@Injectable()
export class CustomerVaultService {
  private readonly logger = new Logger(CustomerVaultService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hybridIntelligence: HybridIntelligenceService
  ) {}

  /**
   * Normalize an extracted key to search the canonical map
   */
  normalizeKey(rawKey: string): string {
    return (rawKey || '')
      .toLowerCase()
      .trim()
      .replace(/[\s\-\.]+/g, '_')
      .replace(/[^a-z0-9_১-৯অ-হ্]/gi, '');
  }

  /**
   * Find or retrieve customer vault profile by phone, vault id, or customerId
   */
  async getProfile(organizationId: string, phoneOrId: string): Promise<CustomerVaultProfile | null> {
    const cleanPhone = phoneOrId.replace(/[^0-9]/g, '');

    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'CustomerVaultProfile',
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const match = logs.find(l => {
      const data = (l.newData as any) || {};
      const savedPhone = (data.phone || '').replace(/[^0-9]/g, '');
      return (
        data.id === phoneOrId ||
        data.customerId === phoneOrId ||
        (cleanPhone.length >= 10 && savedPhone.includes(cleanPhone))
      );
    });

    if (!match) return null;
    const profile = (match.newData as any) as CustomerVaultProfile;
    if (!profile.dynamicFields) profile.dynamicFields = [];
    if (!profile.documents) profile.documents = [];
    return profile;
  }

  /**
   * Find profile strictly by authenticated customerId
   */
  async getProfileByCustomerId(organizationId: string, customerId: string): Promise<CustomerVaultProfile | null> {
    // 1. Direct match on customerId in audit logs
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'CustomerVaultProfile',
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const match = logs.find(l => {
      const data = (l.newData as any) || {};
      return data.customerId === customerId;
    });

    if (match) {
      const profile = (match.newData as any) as CustomerVaultProfile;
      if (!profile.dynamicFields) profile.dynamicFields = [];
      if (!profile.documents) profile.documents = [];
      return profile;
    }

    // 2. Fallback: Lookup Customer in Prisma to link by phone
    const customer = await this.prisma.customer.findFirst({
      where: { organizationId, id: customerId },
    });

    if (customer && customer.phone) {
      const byPhone = await this.getProfile(organizationId, customer.phone);
      if (byPhone) {
        // Link customerId for subsequent quick queries
        byPhone.customerId = customer.id;
        return byPhone;
      }
    }

    // 3. Return an initialized empty profile for this customer if none exists yet
    if (customer) {
      const nowIso = new Date().toISOString();
      const newProfile: CustomerVaultProfile = {
        id: `VAULT-${customer.id.slice(0, 8)}`,
        customerId: customer.id,
        organizationId,
        phone: customer.phone || '',
        email: customer.email || undefined,
        nameBn: '',
        nameEn: customer.name || 'Citizen Customer',
        dob: '',
        presentAddress: customer.address || '',
        permanentAddress: '',
        educationHistory: [],
        documents: [],
        dynamicFields: [],
        consentRecord: {
          consentGiven: true,
          consentGivenAt: nowIso,
          purposeBn: 'নাগরিক সেবা ও প্রোফাইল ডাটাবেজ পরিচালনার জন্য সম্মতি।',
          aiProcessingConsented: true,
        },
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      return newProfile;
    }

    return null;
  }

  /**
   * Create or update customer profile in the secure vault with audit trail
   */
  async upsertProfile(
    organizationId: string,
    userId: string | null,
    profileData: Partial<CustomerVaultProfile> & { phone: string; nameEn: string; customerId?: string }
  ): Promise<CustomerVaultProfile> {
    if (!profileData.phone || !profileData.nameEn) {
      throw new BadRequestException('Phone number and English name are mandatory for customer vault registration.');
    }

    const cleanPhone = profileData.phone.replace(/[^0-9]/g, '');
    let existing = profileData.customerId
      ? await this.getProfileByCustomerId(organizationId, profileData.customerId)
      : await this.getProfile(organizationId, cleanPhone);

    const nowIso = new Date().toISOString();
    const id = existing?.id || `VAULT-${cleanPhone.slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const mergedDocs = [...(existing?.documents || [])];
    if (profileData.documents && profileData.documents.length > 0) {
      for (const newDoc of profileData.documents) {
        const docIdx = mergedDocs.findIndex(d => d.id === newDoc.id || (d.docType === newDoc.docType && d.title === newDoc.title));
        if (docIdx >= 0) {
          mergedDocs[docIdx] = { ...mergedDocs[docIdx], ...newDoc, uploadedAt: nowIso };
        } else {
          mergedDocs.push({
            ...newDoc,
            id: newDoc.id || `doc-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            uploadedAt: nowIso,
            isVerified: newDoc.isVerified ?? false,
          });
        }
      }
    }

    // Merge Dynamic Fields safely
    const mergedDynamicFields = [...(existing?.dynamicFields || [])];
    if (profileData.dynamicFields && profileData.dynamicFields.length > 0) {
      for (const df of profileData.dynamicFields) {
        const idx = mergedDynamicFields.findIndex(f => f.key === df.key);
        if (idx >= 0) {
          mergedDynamicFields[idx] = { ...mergedDynamicFields[idx], ...df, updatedAt: nowIso };
        } else {
          mergedDynamicFields.push({
            ...df,
            id: df.id || `df-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            updatedAt: nowIso,
          });
        }
      }
    }

    const updatedProfile: CustomerVaultProfile = {
      id,
      customerId: profileData.customerId || existing?.customerId,
      organizationId,
      phone: profileData.phone.trim(),
      email: profileData.email || existing?.email,
      nameBn: profileData.nameBn || existing?.nameBn || '',
      nameEn: profileData.nameEn.trim(),
      fatherNameBn: profileData.fatherNameBn || existing?.fatherNameBn,
      fatherNameEn: profileData.fatherNameEn || existing?.fatherNameEn,
      motherNameBn: profileData.motherNameBn || existing?.motherNameBn,
      motherNameEn: profileData.motherNameEn || existing?.motherNameEn,
      dob: profileData.dob || existing?.dob || '',
      gender: profileData.gender || existing?.gender || 'MALE',
      nidNumber: profileData.nidNumber || existing?.nidNumber,
      birthRegNumber: profileData.birthRegNumber || existing?.birthRegNumber,
      presentAddress: profileData.presentAddress || existing?.presentAddress || '',
      permanentAddress: profileData.permanentAddress || existing?.permanentAddress || '',
      educationHistory: profileData.educationHistory || existing?.educationHistory || [],
      documents: mergedDocs,
      dynamicFields: mergedDynamicFields,
      photoUrl: profileData.photoUrl || existing?.photoUrl,
      signatureUrl: profileData.signatureUrl || existing?.signatureUrl,
      consentRecord: profileData.consentRecord || existing?.consentRecord || {
        consentGiven: true,
        consentGivenAt: nowIso,
        purposeBn: 'সরকারি ও অনলাইন সেবা ফরম পূরণের জন্য নাগরিকের সম্মতিক্রমে তথ্য সংরক্ষণ।',
        aiProcessingConsented: true,
      },
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    // Also link with Prisma Customer model
    try {
      let existingCustomer = profileData.customerId
        ? await this.prisma.customer.findFirst({ where: { organizationId, id: profileData.customerId } })
        : null;

      if (!existingCustomer) {
        existingCustomer = await this.prisma.customer.findFirst({
          where: {
            organizationId,
            phone: { contains: cleanPhone.slice(-10) },
          },
        });
      }

      if (!existingCustomer) {
        const createdCust = await this.prisma.customer.create({
          data: {
            organizationId,
            name: updatedProfile.nameEn,
            phone: updatedProfile.phone,
            email: updatedProfile.email,
            address: updatedProfile.presentAddress,
            notes: `Vault Profile ID: ${id}. NID: ${updatedProfile.nidNumber || 'N/A'}`,
          },
        });
        updatedProfile.customerId = createdCust.id;
      } else {
        updatedProfile.customerId = existingCustomer.id;
      }
    } catch (e: any) {
      this.logger.warn(`Could not sync Customer entity: ${e.message}`);
    }

    // Save in AuditLog with entityType='CustomerVaultProfile'
    let staffUserId: string | undefined = undefined;
    if (userId) {
      const staff = await this.prisma.user.findFirst({ where: { id: userId } });
      if (staff) staffUserId = userId;
    }

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: staffUserId,
        entityType: 'CustomerVaultProfile',
        entityId: id,
        action: existing ? 'UPDATE_VAULT_PROFILE' : 'CREATE_VAULT_PROFILE',
        oldData: (existing as any) || undefined,
        newData: updatedProfile as any,
      },
    });

    return updatedProfile;
  }

  /**
   * Phase 3.2: Collective Multiple-File Upload & Intelligent Analysis
   * Processes an array of files uploaded in one session, performs OCR/parsing,
   * maps fields to canonical synonyms, discovers genuinely new dynamic fields,
   * detects cross-document contradictions (conflicts), and updates the customer's vault safely.
   */
  async processMultipleDocumentsCollective(
    organizationId: string,
    customerId: string,
    documents: Array<{
      filename: string;
      docType: 'PHOTO' | 'SIGNATURE' | 'NID' | 'BIRTH_CERTIFICATE' | 'ACADEMIC_CERT' | 'TRADE_LICENSE' | 'CITIZEN_CERT' | 'OTHER';
      fileBase64OrText: string;
      mimeType?: string;
      sizeBytes?: number;
    }>
  ) {
    if (!documents || documents.length === 0) {
      throw new BadRequestException('At least one document must be uploaded for collective extraction.');
    }

    // 1. Get or initialize customer profile
    let profile = await this.getProfileByCustomerId(organizationId, customerId);
    if (!profile) {
      const customer = await this.prisma.customer.findFirst({
        where: { organizationId, id: customerId },
      });
      if (!customer) throw new NotFoundException('Customer record not found.');
      profile = await this.upsertProfile(organizationId, customerId, {
        customerId,
        phone: customer.phone || '01700000000',
        nameEn: customer.name,
      });
    }

    const nowIso = new Date().toISOString();
    const extractedFieldsSummary: Record<string, any> = {};
    const newDynamicFieldsDiscovered: DynamicCustomerField[] = [];
    const conflictsDetected: Array<{ field: string; existingValue: any; extractedValue: any; sourceDoc: string }> = [];
    const processedDocs: CustomerVaultItem[] = [];

    // 2. Process each document iteratively
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const docId = `doc-${Date.now()}-${i}-${Math.floor(100 + Math.random() * 900)}`;

      // Execute extraction via HybridIntelligence / local heuristics
      let rawText = '';
      let confidence = 0.85;
      let extractedData: Record<string, any> = {};

      try {
        const parsed = await this.extractDocumentFields(doc.fileBase64OrText, doc.docType, doc.filename);
        confidence = parsed.confidence;
        rawText = parsed.rawText;
        extractedData = {
          ...(parsed.extractedNameBn ? { nameBn: parsed.extractedNameBn } : {}),
          ...(parsed.extractedNameEn ? { nameEn: parsed.extractedNameEn } : {}),
          ...(parsed.extractedDob ? { dob: parsed.extractedDob } : {}),
          ...(parsed.extractedNidOrReg ? { nidNumber: parsed.extractedNidOrReg } : {}),
          ...(parsed.additionalAttributes || {}),
        };
      } catch (err: any) {
        this.logger.warn(`Document extraction failed for ${doc.filename}: ${err.message}`);
        rawText = `Parsing fallback: ${doc.filename}`;
      }

      const vaultDocItem: CustomerVaultItem = {
        id: docId,
        docType: doc.docType,
        title: doc.filename,
        fileUrlOrBase64: doc.fileBase64OrText.length > 500 ? doc.fileBase64OrText.slice(0, 500) + '...[truncated]' : doc.fileBase64OrText,
        mimeType: doc.mimeType || 'application/octet-stream',
        sizeBytes: doc.sizeBytes || doc.fileBase64OrText.length,
        uploadedAt: nowIso,
        isVerified: false,
        extractedTextPreview: rawText.slice(0, 200),
      };
      processedDocs.push(vaultDocItem);

      // 3. Map extracted keys to canonical fields and check conflicts
      for (const [rawKey, rawVal] of Object.entries(extractedData)) {
        if (!rawVal) continue;
        const normalized = this.normalizeKey(rawKey);
        const canonical = CANONICAL_FIELD_MAP[normalized];

        if (canonical) {
          const cKey = canonical.canonicalKey;
          extractedFieldsSummary[cKey] = rawVal;

          // Check standard profile fields (e.g. dob, nidNumber, nameEn)
          const existingProfileVal = (profile as any)[cKey];
          if (existingProfileVal && existingProfileVal.trim && existingProfileVal.trim() !== '') {
            // Check if conflict
            if (existingProfileVal.trim().toLowerCase() !== String(rawVal).trim().toLowerCase()) {
              conflictsDetected.push({
                field: canonical.labelEn,
                existingValue: existingProfileVal,
                extractedValue: rawVal,
                sourceDoc: doc.filename,
              });
            }
          } else if (!(profile as any)[cKey]) {
            // Set unpopulated standard field safely
            (profile as any)[cKey] = String(rawVal);
          }

          // Also check dynamic fields
          const existingDf = (profile.dynamicFields || []).find(f => f.key === cKey);
          if (existingDf) {
            if (existingDf.value && String(existingDf.value).trim().toLowerCase() !== String(rawVal).trim().toLowerCase()) {
              existingDf.isConflicting = true;
              if (!existingDf.conflictingValues) existingDf.conflictingValues = [];
              existingDf.conflictingValues.push({
                value: rawVal,
                source: doc.filename,
                timestamp: nowIso,
              });
            }
          } else {
            // New canonical dynamic field
            const newField: DynamicCustomerField = {
              id: `df-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
              key: cKey,
              labelEn: canonical.labelEn,
              labelBn: canonical.labelBn,
              category: canonical.category,
              fieldType: canonical.fieldType,
              value: rawVal,
              sourceDocId: docId,
              sourceDocName: doc.filename,
              confidence,
              status: 'SUGGESTED',
              updatedAt: nowIso,
            };
            newDynamicFieldsDiscovered.push(newField);
          }
        } else {
          // Genuinely new unknown attribute discovered by AI
          const formattedLabelEn = rawKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const newField: DynamicCustomerField = {
            id: `df-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            key: normalized || `custom_${Date.now()}`,
            labelEn: formattedLabelEn,
            labelBn: formattedLabelEn,
            category: 'OTHER',
            fieldType: typeof rawVal === 'number' ? 'NUMBER' : 'TEXT',
            value: rawVal,
            sourceDocId: docId,
            sourceDocName: doc.filename,
            confidence,
            status: 'SUGGESTED',
            updatedAt: nowIso,
          };
          newDynamicFieldsDiscovered.push(newField);
        }
      }
    }

    // 4. Update profile with merged documents and new dynamic fields
    profile.documents = [...(profile.documents || []), ...processedDocs];
    profile.dynamicFields = [...(profile.dynamicFields || []), ...newDynamicFieldsDiscovered];
    profile.updatedAt = nowIso;

    // Persist via upsertProfile
    await this.upsertProfile(organizationId, customerId, profile);

    return {
      success: true,
      processedDocumentCount: processedDocs.length,
      extractedSummary: extractedFieldsSummary,
      newDynamicFieldsCount: newDynamicFieldsDiscovered.length,
      newDynamicFields: newDynamicFieldsDiscovered,
      conflictsCount: conflictsDetected.length,
      conflicts: conflictsDetected,
      documents: processedDocs,
    };
  }

  /**
   * Phase 3.5: Customer-editable dynamic field update
   */
  async updateDynamicField(
    organizationId: string,
    customerId: string,
    fieldId: string,
    update: Partial<DynamicCustomerField>
  ) {
    const profile = await this.getProfileByCustomerId(organizationId, customerId);
    if (!profile) throw new NotFoundException('Customer profile not found.');

    const fieldIdx = (profile.dynamicFields || []).findIndex(f => f.id === fieldId || f.key === fieldId);
    if (fieldIdx < 0) throw new NotFoundException(`Dynamic field ${fieldId} not found.`);

    profile.dynamicFields[fieldIdx] = {
      ...profile.dynamicFields[fieldIdx],
      ...update,
      updatedAt: new Date().toISOString(),
    };

    return this.upsertProfile(organizationId, customerId, profile);
  }

  /**
   * Phase 3.5: Delete a dynamic field
   */
  async deleteDynamicField(organizationId: string, customerId: string, fieldId: string) {
    const profile = await this.getProfileByCustomerId(organizationId, customerId);
    if (!profile) throw new NotFoundException('Customer profile not found.');

    profile.dynamicFields = (profile.dynamicFields || []).filter(f => f.id !== fieldId && f.key !== fieldId);
    return this.upsertProfile(organizationId, customerId, profile);
  }

  /**
   * Phase 2.2: Privacy Consent & Retention
   */
  async updatePrivacyConsent(
    organizationId: string,
    customerId: string,
    consentData: { consentGiven: boolean; aiProcessingConsented: boolean; purposeBn?: string }
  ) {
    const profile = await this.getProfileByCustomerId(organizationId, customerId);
    if (!profile) throw new NotFoundException('Customer profile not found.');

    profile.consentRecord = {
      consentGiven: consentData.consentGiven,
      aiProcessingConsented: consentData.aiProcessingConsented,
      purposeBn: consentData.purposeBn || profile.consentRecord?.purposeBn || 'নাগরিক সেবা ও তথ্য প্রক্রিয়াকরণ সম্মতি।',
      consentGivenAt: new Date().toISOString(),
    };

    return this.upsertProfile(organizationId, customerId, profile);
  }

  /**
   * Phase 2.2: GDPR/Privacy Data Erasure Request
   */
  async requestDataErasure(organizationId: string, customerId: string, reason?: string) {
    const profile = await this.getProfileByCustomerId(organizationId, customerId);
    if (!profile) throw new NotFoundException('Customer profile not found.');

    // Log the erasure request for compliance audit
    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: undefined,
        entityType: 'CustomerVaultProfile',
        entityId: profile.id,
        action: 'DATA_ERASURE_REQUEST',
        newData: {
          requestedAt: new Date().toISOString(),
          reason: reason || 'Customer requested full personal data erasure.',
          phone: profile.phone,
        },
      },
    });

    // Anonymize sensitive fields
    profile.nidNumber = undefined;
    profile.birthRegNumber = undefined;
    profile.fatherNameBn = undefined;
    profile.fatherNameEn = undefined;
    profile.motherNameBn = undefined;
    profile.motherNameEn = undefined;
    profile.presentAddress = 'REDACTED_UPON_REQUEST';
    profile.permanentAddress = 'REDACTED_UPON_REQUEST';
    profile.documents = [];
    profile.dynamicFields = [];
    profile.updatedAt = new Date().toISOString();

    return this.upsertProfile(organizationId, customerId, profile);
  }

  /**
   * Document OCR & AI Structured Field Extraction Helper
   */
  async extractDocumentFields(fileBase64OrText: string, docTypeHint: string, filename?: string): Promise<{
    extractedNameBn?: string;
    extractedNameEn?: string;
    extractedDob?: string;
    extractedNidOrReg?: string;
    additionalAttributes?: Record<string, any>;
    confidence: number;
    rawText: string;
    engine: 'AI_GEMINI' | 'ALGORITHMIC_FALLBACK';
  }> {
    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

    if (geminiApiKey && geminiApiKey.length > 5 && !geminiApiKey.includes('placeholder')) {
      try {
        const prompt = `You are an expert OCR and identity document parser for Bangladesh (NID, Birth Certificate, Educational Certificates, Trade License, Passport).
Extract the person's identity and document details from the following document data or OCR text:
Document Hint: "${docTypeHint}", Filename: "${filename || 'unknown'}".
Content snippet:
${fileBase64OrText.slice(0, 3000)}

Respond strictly in JSON format (no markdown, no backticks):
{
  "nameBn": "<Name in Bengali if found, else empty>",
  "nameEn": "<Name in English CAPS if found, else empty>",
  "dob": "<Date of Birth in YYYY-MM-DD if found, else empty>",
  "nidOrReg": "<NID or Birth Registration Number if found, else empty>",
  "attributes": {
    "<attribute_key>": "<attribute_value>"
  },
  "confidence": 0.9,
  "rawSummary": "<Concise summary of detected document>"
}`;

        // Use valid model name
        const model = 'gemini-2.5-flash';
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
            return {
              extractedNameBn: parsed.nameBn || undefined,
              extractedNameEn: parsed.nameEn || undefined,
              extractedDob: parsed.dob || undefined,
              extractedNidOrReg: parsed.nidOrReg || undefined,
              additionalAttributes: parsed.attributes || {},
              confidence: Number(parsed.confidence) || 0.88,
              rawText: parsed.rawSummary || 'Parsed via Google Gemini',
              engine: 'AI_GEMINI',
            };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Gemini OCR helper failed: ${err.message}. Using regex heuristic.`);
      }
    }

    // Algorithmic Fallback Regex Heuristic
    const text = fileBase64OrText;
    const nidMatch = text.match(/\b(19\d{15}|20\d{15}|\d{13}|\d{10})\b/);
    const dobMatch = text.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/);

    // Heuristics for education & certificates
    const additionalAttrs: Record<string, any> = {};
    const rollMatch = text.match(/roll\s*(?:no\.?|number|:)?\s*([0-9]{4,8})/i);
    if (rollMatch) additionalAttrs['roll_number'] = rollMatch[1];

    const regMatch = text.match(/reg(?:istration)?\s*(?:no\.?|number|:)?\s*([0-9]{6,12})/i);
    if (regMatch) additionalAttrs['reg_number'] = regMatch[1];

    const gpaMatch = text.match(/(?:gpa|cgpa|result)\s*(?:[:=]|\sis\s)?\s*([0-5]\.\d{1,2})/i);
    if (gpaMatch) additionalAttrs['result_cgpa'] = gpaMatch[1];

    const passYearMatch = text.match(/(?:passing\s*year|year)\s*(?:[:=])?\s*(19\d{2}|20\d{2})/i);
    if (passYearMatch) additionalAttrs['passing_year'] = passYearMatch[1];

    return {
      extractedNidOrReg: nidMatch ? nidMatch[0] : undefined,
      extractedDob: dobMatch ? dobMatch[0] : undefined,
      additionalAttributes: Object.keys(additionalAttrs).length > 0 ? additionalAttrs : undefined,
      confidence: nidMatch || dobMatch || Object.keys(additionalAttrs).length > 0 ? 0.72 : 0.45,
      rawText: 'Extracted using local algorithmic heuristics.',
      engine: 'ALGORITHMIC_FALLBACK',
    };
  }
}
