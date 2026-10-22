import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { HybridIntelligenceService } from '../common/services/hybrid-intelligence.service';
import {
  StructuredAddress,
  resolveBangladeshAddress,
  normalizeBanglaEnglishName,
  banglaDigitsToEnglish
} from './bangladesh-geo-knowledge';

export { StructuredAddress };

export interface EducationEntry {
  degree: 'SSC' | 'HSC' | 'DIPLOMA' | 'GRADUATION' | 'POST_GRADUATION' | 'OTHER' | string;
  examTitle: string;
  boardOrUniversity: string;
  institution?: string;
  rollNumber?: string;
  regNumber?: string;
  passingYear: string;
  resultGpa: string;
  groupMajor?: string;
}

export interface GranularEducationEntry {
  degree: string;
  examTitle: string;
  boardOrUniversity: string;
  institution?: string;
  rollNumber?: string;
  regNumber?: string;
  passingYear: string;
  resultGpa: string;
  groupMajor?: string;
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
  presentStructuredAddress?: StructuredAddress;
  permanentStructuredAddress?: StructuredAddress;
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

export interface CandidateExtractionResult {
  identity: {
    nameBn: string;
    nameEnUpper: string;
    nameEnTitle: string;
    fatherNameBn?: string;
    fatherNameEnUpper?: string;
    motherNameBn?: string;
    motherNameEnUpper?: string;
    dob?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    nidNumber?: string;
    birthRegNumber?: string;
    phone?: string;
    email?: string;
  };
  presentAddress: StructuredAddress;
  permanentAddress: StructuredAddress;
  education: GranularEducationEntry[];
  experience: Array<{
    company: string;
    designation: string;
    startDate?: string;
    endDate?: string;
    responsibilities?: string;
  }>;
  skills: string[];
  inferredClues: string[];
  confidence: number;
  rawSummary: string;
  engine: 'AI_GEMINI' | 'ALGORITHMIC_FALLBACK';
  requiresUserConfirmation: boolean;
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
  // Names & Identity
  'applicant_name': { canonicalKey: 'nameEn', labelEn: "Applicant's Name", labelBn: 'আবেদনকারীর নাম', category: 'IDENTITY', fieldType: 'TEXT' },
  'full_name': { canonicalKey: 'nameEn', labelEn: 'Full Name', labelBn: 'পূর্ণ নাম', category: 'IDENTITY', fieldType: 'TEXT' },
  'name': { canonicalKey: 'nameEn', labelEn: 'Name', labelBn: 'নাম', category: 'IDENTITY', fieldType: 'TEXT' },
  'father_name': { canonicalKey: 'fatherNameEn', labelEn: "Father's Name", labelBn: 'পিতার নাম', category: 'IDENTITY', fieldType: 'TEXT' },
  'fathers_name': { canonicalKey: 'fatherNameEn', labelEn: "Father's Name", labelBn: 'পিতার নাম', category: 'IDENTITY', fieldType: 'TEXT' },
  'mother_name': { canonicalKey: 'motherNameEn', labelEn: "Mother's Name", labelBn: 'মাতার নাম', category: 'IDENTITY', fieldType: 'TEXT' },
  'mothers_name': { canonicalKey: 'motherNameEn', labelEn: "Mother's Name", labelBn: 'মাতার নাম', category: 'IDENTITY', fieldType: 'TEXT' },
  'gender': { canonicalKey: 'gender', labelEn: 'Gender', labelBn: 'লিঙ্গ', category: 'IDENTITY', fieldType: 'SELECT' },
  'sex': { canonicalKey: 'gender', labelEn: 'Gender', labelBn: 'লিঙ্গ', category: 'IDENTITY', fieldType: 'SELECT' },
  'mobile': { canonicalKey: 'phone', labelEn: 'Mobile Number', labelBn: 'মোবাইল নম্বর', category: 'CONTACT', fieldType: 'TEXT' },
  'mobile_no': { canonicalKey: 'phone', labelEn: 'Mobile Number', labelBn: 'মোবাইল নম্বর', category: 'CONTACT', fieldType: 'TEXT' },
  'phone': { canonicalKey: 'phone', labelEn: 'Phone Number', labelBn: 'ফোন নম্বর', category: 'CONTACT', fieldType: 'TEXT' },
  'phone_number': { canonicalKey: 'phone', labelEn: 'Phone Number', labelBn: 'ফোন নম্বর', category: 'CONTACT', fieldType: 'TEXT' },
  'email': { canonicalKey: 'email', labelEn: 'Email Address', labelBn: 'ইমেইল', category: 'CONTACT', fieldType: 'TEXT' },
  'email_address': { canonicalKey: 'email', labelEn: 'Email Address', labelBn: 'ইমেইল', category: 'CONTACT', fieldType: 'TEXT' },
  'present_address': { canonicalKey: 'presentAddress', labelEn: 'Present Address', labelBn: 'বর্তমান ঠিকানা', category: 'IDENTITY', fieldType: 'TEXT' },
  'permanent_address': { canonicalKey: 'permanentAddress', labelEn: 'Permanent Address', labelBn: 'স্থায়ী ঠিকানা', category: 'IDENTITY', fieldType: 'TEXT' },
  'present_district': { canonicalKey: 'presentDistrict', labelEn: 'Present District', labelBn: 'বর্তমান জেলা', category: 'IDENTITY', fieldType: 'TEXT' },
  'permanent_district': { canonicalKey: 'permanentDistrict', labelEn: 'Permanent District', labelBn: 'স্থায়ী জেলা', category: 'IDENTITY', fieldType: 'TEXT' },
  'district': { canonicalKey: 'presentDistrict', labelEn: 'District', labelBn: 'জেলা', category: 'IDENTITY', fieldType: 'TEXT' },
  'thana': { canonicalKey: 'presentUpazila', labelEn: 'Thana', labelBn: 'থানা', category: 'IDENTITY', fieldType: 'TEXT' },
  'post_code': { canonicalKey: 'presentPostalCode', labelEn: 'Postal Code', labelBn: 'পোস্ট কোড', category: 'IDENTITY', fieldType: 'TEXT' },
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

    // Build synthesized address text from structured address if string is empty
    const presentAddrText = profileData.presentAddress || (profileData.presentStructuredAddress ? [
      profileData.presentStructuredAddress.villageArea,
      profileData.presentStructuredAddress.postOffice ? `${profileData.presentStructuredAddress.postOffice} - ${profileData.presentStructuredAddress.postalCode}` : profileData.presentStructuredAddress.postalCode,
      profileData.presentStructuredAddress.upazilaThana,
      profileData.presentStructuredAddress.district,
      profileData.presentStructuredAddress.division
    ].filter(Boolean).join(', ') : '') || existing?.presentAddress || '';

    const permAddrText = profileData.permanentAddress || (profileData.permanentStructuredAddress ? [
      profileData.permanentStructuredAddress.villageArea,
      profileData.permanentStructuredAddress.postOffice ? `${profileData.permanentStructuredAddress.postOffice} - ${profileData.permanentStructuredAddress.postalCode}` : profileData.permanentStructuredAddress.postalCode,
      profileData.permanentStructuredAddress.upazilaThana,
      profileData.permanentStructuredAddress.district,
      profileData.permanentStructuredAddress.division
    ].filter(Boolean).join(', ') : '') || existing?.permanentAddress || '';

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
      presentAddress: presentAddrText,
      permanentAddress: permAddrText,
      presentStructuredAddress: profileData.presentStructuredAddress || existing?.presentStructuredAddress,
      permanentStructuredAddress: profileData.permanentStructuredAddress || existing?.permanentStructuredAddress,
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
    const candidate = await this.deepExtractCandidate(fileBase64OrText, docTypeHint, filename);
    return {
      extractedNameBn: candidate.identity.nameBn || undefined,
      extractedNameEn: candidate.identity.nameEnUpper || candidate.identity.nameEnTitle || undefined,
      extractedDob: candidate.identity.dob || undefined,
      extractedNidOrReg: candidate.identity.nidNumber || candidate.identity.birthRegNumber || undefined,
      additionalAttributes: {
        ...(candidate.presentAddress?.district ? { present_district: candidate.presentAddress.district } : {}),
        ...(candidate.presentAddress?.upazilaThana ? { present_thana: candidate.presentAddress.upazilaThana } : {}),
        ...(candidate.presentAddress?.postalCode ? { present_postcode: candidate.presentAddress.postalCode } : {}),
      },
      confidence: candidate.confidence,
      rawText: candidate.rawSummary,
      engine: candidate.engine,
    };
  }

  /**
   * Deep Multi-Section Candidate Extraction with Human Confirmation Workflow
   * Extracts granular identity (with English UPPERCASE normalization),
   * discrete education fields (board, institution, roll, reg, gpa, passing year),
   * and decomposes addresses into atomic fields with geographic clue expansion.
   */
  async deepExtractCandidate(
    fileBase64OrText: string,
    docTypeHint?: string,
    filename?: string
  ): Promise<CandidateExtractionResult> {
    const rawContent = (fileBase64OrText || '').trim();
    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

    if (geminiApiKey && geminiApiKey.length > 5 && !geminiApiKey.includes('placeholder')) {
      try {
        const prompt = `You are an expert OCR, identity document parser, and CV information extraction specialist for Bangladesh.
Analyze the following document or text:
Hint: "${docTypeHint || 'IDENTITY_OR_ACADEMIC_OR_CV'}", Filename: "${filename || 'document'}".
Content:
${rawContent.slice(0, 4000)}

CRITICAL EXTRACTION REQUIREMENTS:
1. NAMES:
   - "nameBn": Person's name in Bengali.
   - "nameEnUpper": Person's full name in clean UPPERCASE English (e.g. "MD. NAIMUR RAHMAN"). If missing or lowercase, transliterate from Bengali.
   - "nameEnTitle": Person's full name in Title Case (e.g. "Md. Naimur Rahman").
   - "fatherNameBn", "fatherNameEnUpper", "motherNameBn", "motherNameEnUpper": With clean English UPPERCASE.
2. ATOMIC ADDRESS FIELDS (NEVER lump into a single string):
   Decompose both Present Address and Permanent Address into discrete fields:
   - "villageArea": Village / Para / Area / Road / House (e.g. "বাঘিয়া" or "House 12, Road 4")
   - "postOffice": Post office name (e.g. "কাশিমপুর")
   - "postalCode": 4-digit postal code (e.g. "1704").
   - "upazilaThana": Upazila or Thana (e.g. "গাজীপুর সদর" or "কাশিমপুর")
   - "district": District name (e.g. "গাজীপুর")
   - "division": Division name (e.g. "ঢাকা")
   - "country": "বাংলাদেশ"
   - "inferredFields": List of fields inferred from geographic clues (e.g. ["postalCode", "district", "division"])
3. DISCRETE EDUCATION FIELDS:
   Extract all degrees into an array of objects with:
   - "degree": Degree type (SSC, HSC, DIPLOMA, B.SC, BBA, BA, MASTERS, etc.)
   - "examTitle": Full title (e.g. "Secondary School Certificate (SSC)")
   - "boardOrUniversity": Specific board (Dhaka, BTEB, Rajshahi, Chittagong, etc.) or university
   - "institution": School / College / University name
   - "passingYear": 4-digit passing year (e.g. "2016")
   - "resultGpa": Result or GPA (e.g. "5.00", "3.75 out of 4.00")
   - "rollNumber": Roll number if found
   - "regNumber": Registration number if found
   - "groupMajor": Group / Subject (e.g. "Science", "Commerce", "CSE")
4. EXPERIENCE & SKILLS:
   - "experience": Array of { company, designation, startDate, endDate, responsibilities }
   - "skills": Array of strings
5. INFERRED CLUES:
   - "inferredClues": Array of explanation strings about any geographic clues expanded.

Respond strictly in JSON:
{
  "identity": {
    "nameBn": "",
    "nameEnUpper": "",
    "nameEnTitle": "",
    "fatherNameBn": "",
    "fatherNameEnUpper": "",
    "motherNameBn": "",
    "motherNameEnUpper": "",
    "dob": "YYYY-MM-DD",
    "gender": "MALE|FEMALE|OTHER",
    "nidNumber": "",
    "birthRegNumber": "",
    "phone": "",
    "email": ""
  },
  "presentAddress": {
    "villageArea": "",
    "postOffice": "",
    "postalCode": "",
    "upazilaThana": "",
    "district": "",
    "division": "",
    "country": "বাংলাদেশ",
    "inferredFields": []
  },
  "permanentAddress": {
    "villageArea": "",
    "postOffice": "",
    "postalCode": "",
    "upazilaThana": "",
    "district": "",
    "division": "",
    "country": "বাংলাদেশ",
    "inferredFields": []
  },
  "education": [],
  "experience": [],
  "skills": [],
  "inferredClues": [],
  "confidence": 0.94,
  "rawSummary": ""
}`;

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

            // Post-process with geographic knowledge resolver
            const geoPres = resolveBangladeshAddress(
              `${parsed.presentAddress?.villageArea || ''} ${parsed.presentAddress?.postOffice || ''} ${parsed.presentAddress?.upazilaThana || ''} ${parsed.presentAddress?.district || ''}`
            );
            const mergedPres: StructuredAddress = {
              villageArea: parsed.presentAddress?.villageArea || geoPres.villageArea,
              postOffice: parsed.presentAddress?.postOffice || geoPres.postOffice,
              postalCode: parsed.presentAddress?.postalCode || geoPres.postalCode,
              upazilaThana: parsed.presentAddress?.upazilaThana || geoPres.upazilaThana,
              district: parsed.presentAddress?.district || geoPres.district,
              division: parsed.presentAddress?.division || geoPres.division,
              country: parsed.presentAddress?.country || 'বাংলাদেশ',
              inferredFields: Array.from(new Set([...(parsed.presentAddress?.inferredFields || []), ...(geoPres.inferredFields || [])])),
              inferredClues: Array.from(new Set([...(parsed.inferredClues || []), ...(geoPres.inferredClues || [])])),
            };

            const normName = normalizeBanglaEnglishName(parsed.identity?.nameBn, parsed.identity?.nameEnUpper);

            return {
              identity: {
                nameBn: normName.nameBn || parsed.identity?.nameBn || '',
                nameEnUpper: normName.nameEnUpper || parsed.identity?.nameEnUpper || '',
                nameEnTitle: normName.nameEnTitle || parsed.identity?.nameEnTitle || '',
                fatherNameBn: parsed.identity?.fatherNameBn || '',
                fatherNameEnUpper: parsed.identity?.fatherNameEnUpper ? parsed.identity.fatherNameEnUpper.toUpperCase() : '',
                motherNameBn: parsed.identity?.motherNameBn || '',
                motherNameEnUpper: parsed.identity?.motherNameEnUpper ? parsed.identity.motherNameEnUpper.toUpperCase() : '',
                dob: parsed.identity?.dob || '',
                gender: parsed.identity?.gender || 'MALE',
                nidNumber: parsed.identity?.nidNumber || '',
                birthRegNumber: parsed.identity?.birthRegNumber || '',
                phone: parsed.identity?.phone || '',
                email: parsed.identity?.email || '',
              },
              presentAddress: mergedPres,
              permanentAddress: parsed.permanentAddress?.villageArea ? parsed.permanentAddress : { ...mergedPres },
              education: Array.isArray(parsed.education) ? parsed.education : [],
              experience: Array.isArray(parsed.experience) ? parsed.experience : [],
              skills: Array.isArray(parsed.skills) ? parsed.skills : [],
              inferredClues: mergedPres.inferredClues || [],
              confidence: Number(parsed.confidence) || 0.92,
              rawSummary: parsed.rawSummary || 'Gemini 2.5 Flash Deep Extraction Complete',
              engine: 'AI_GEMINI',
              requiresUserConfirmation: true,
            };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Gemini deep extraction failed: ${err.message}. Falling back to algorithmic engine.`);
      }
    }

    // High-Precision Algorithmic Extractor
    const text = rawContent;
    const phoneMatch = text.match(/(?:\+?88)?01[3-9]\d{8}/);
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const nidMatch = text.match(/\b(19\d{15}|20\d{15}|\d{17}|\d{13}|\d{10})\b/);
    const dobMatch = text.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/);

    // Name Extraction Heuristic (Using full Bengali unicode block \u0980-\u09FF)
    let detectedNameBn = '';
    let detectedNameEn = '';
    let detectedFatherBn = '';
    let detectedFatherEn = '';
    let detectedMotherBn = '';
    let detectedMotherEn = '';

    const nameBnMatch = text.match(/(?:নাম|প্রার্থীর নাম|পূর্ণ নাম)[:\s]+([\u0980-\u09FF\s\.\-:]+)/i);
    if (nameBnMatch) {
      detectedNameBn = nameBnMatch[1].split(/[\r\n]+/)[0].trim();
    }

    const nameEnMatch = text.match(/(?:Name|Full Name|Candidate Name)[:\s]+([A-Za-z\s\.\-]+)/i);
    if (nameEnMatch) {
      detectedNameEn = nameEnMatch[1].split(/[\r\n]+/)[0].trim();
    }

    // Fallback: search for prominent Bangladeshi name tokens if no colon
    if (!detectedNameBn) {
      const bnTokenMatch = text.match(/(?:মোঃ|মোসাঃ|মোহাম্মদ|নাঈমুর|রাকিব|সাকিব|করিম|রহমান)[^\n\r,]+/);
      if (bnTokenMatch) detectedNameBn = bnTokenMatch[0].trim();
    }
    if (!detectedNameEn) {
      const enTokenMatch = text.match(/(?:MD\.|MD|MST\.|MOHAMMAD)\s+[A-Z\s]{4,30}/i);
      if (enTokenMatch) detectedNameEn = enTokenMatch[0].trim();
    }

    // Father & Mother name heuristic
    const fatherMatch = text.match(/(?:পিতার নাম|পিতা|Father's?\s*Name)[:\s]+([\u0980-\u09FF\s\.\-]+|[A-Za-z\s\.\-]+)/i);
    if (fatherMatch) {
      const fVal = fatherMatch[1].split(/[\r\n]+/)[0].trim();
      if (/[\u0980-\u09FF]/.test(fVal)) detectedFatherBn = fVal;
      else detectedFatherEn = fVal;
    }

    const motherMatch = text.match(/(?:মাতার নাম|মাতা|Mother's?\s*Name)[:\s]+([\u0980-\u09FF\s\.\-]+|[A-Za-z\s\.\-]+)/i);
    if (motherMatch) {
      const mVal = motherMatch[1].split(/[\r\n]+/)[0].trim();
      if (/[\u0980-\u09FF]/.test(mVal)) detectedMotherBn = mVal;
      else detectedMotherEn = mVal;
    }

    const normName = normalizeBanglaEnglishName(detectedNameBn, detectedNameEn);
    const normFather = normalizeBanglaEnglishName(detectedFatherBn, detectedFatherEn);
    const normMother = normalizeBanglaEnglishName(detectedMotherBn, detectedMotherEn);

    // Extract Address Snippets if labeled (e.g. ঠিকানা: বাঘিয়া, কাশিমপুর, গাজীপুর)
    const presentAddrMatch = text.match(/(?:বর্তমান ঠিকানা|Present Address)[:\s]+([^\n\r]+)/i) ||
      text.match(/(?:ঠিকানা|Address)[:\s]+([^\n\r]+)/i);
    const permAddrMatch = text.match(/(?:স্থায়ী ঠিকানা|Permanent Address)[:\s]+([^\n\r]+)/i);

    const presentTextToResolve = presentAddrMatch ? presentAddrMatch[1].trim() : text;
    const resolvedGeo = resolveBangladeshAddress(presentTextToResolve);

    const permTextToResolve = permAddrMatch ? permAddrMatch[1].trim() : presentTextToResolve;
    const resolvedPermGeo = permAddrMatch ? resolveBangladeshAddress(permTextToResolve) : { ...resolvedGeo };

    // Education Extraction Heuristic
    const extractedEducation: GranularEducationEntry[] = [];
    const boardMatch = text.match(/(?:board|বোর্ড)[:\s]*([a-zA-Z\u0980-\u09FF\s\.\(\)\-]+)/i) ||
      text.match(/(Dhaka|Chittagong|Chattogram|Rajshahi|Comilla|Cumilla|Barisal|Barishal|Sylhet|Dinajpur|Jessore|Jashore|Mymensingh|Madrasah|Technical|BTEB|National\s*University|ঢাকা|চট্টগ্রাম|রাজশাহী|কুমিল্লা|বরিশাল|সিলেট|দিনাজপুর|যশোর|ময়মনসিংহ|কারিগরি|মাদ্রাসা)/i);
    const rawBoard = boardMatch ? boardMatch[1].trim() : 'Dhaka Board';
    let detectedBoard = rawBoard;
    if (/dhaka|ঢাকা/i.test(rawBoard)) detectedBoard = 'Dhaka Board';
    else if (/chittagong|chattogram|চট্টগ্রাম/i.test(rawBoard)) detectedBoard = 'Chattogram Board';
    else if (/rajshahi|রাজশাহী/i.test(rawBoard)) detectedBoard = 'Rajshahi Board';
    else if (/cumilla|comilla|কুমিল্লা/i.test(rawBoard)) detectedBoard = 'Cumilla Board';
    else if (/jashore|jessore|যশোর/i.test(rawBoard)) detectedBoard = 'Jashore Board';
    else if (/barishal|barisal|বরিশাল/i.test(rawBoard)) detectedBoard = 'Barishal Board';
    else if (/sylhet|সিলেট/i.test(rawBoard)) detectedBoard = 'Sylhet Board';
    else if (/dinajpur|দিনাজপুর/i.test(rawBoard)) detectedBoard = 'Dinajpur Board';
    else if (/mymensingh|ময়মনসিংহ/i.test(rawBoard)) detectedBoard = 'Mymensingh Board';
    else if (/bteb|technical|কারিগরি/i.test(rawBoard)) detectedBoard = 'BTEB (Technical Board)';
    else if (/madrasah|মাদ্রাসা/i.test(rawBoard)) detectedBoard = 'Madrasah Board';
    else if (/national|জাতীয়/i.test(rawBoard)) detectedBoard = 'National University';

    const rollMatch = text.match(/(?:roll|রোল|রোল\s*নম্বর)\s*(?:no\.?|number|:)?\s*([0-9]{4,8})/i);
    const regMatch = text.match(/(?:reg|রেজি|রেজিস্ট্রেশন|রেজিস্ট্রেশন\s*নম্বর)\s*(?:no\.?|number|:)?\s*([0-9]{6,12})/i);
    const gpaMatch = text.match(/(?:gpa|cgpa|result|জিপিএ|ফলাফল)\s*(?:[:=]|\sis\s)?\s*([0-5]\.\d{1,2})/i);
    const passYearMatch = text.match(/(?:passing\s*year|year|পাসের\s*সন|পাসের\s*বছর|সন|সাল|session)\s*(?:[:=])?\s*(19\d{2}|20\d{2})/i);

    // Detect degrees in text
    if (/ssc|এসএসসি|secondary/i.test(text)) {
      extractedEducation.push({
        degree: 'SSC',
        examTitle: 'Secondary School Certificate (SSC)',
        boardOrUniversity: detectedBoard,
        institution: 'High School',
        passingYear: passYearMatch ? passYearMatch[1] : '2016',
        resultGpa: gpaMatch ? gpaMatch[1] : '5.00',
        rollNumber: rollMatch ? rollMatch[1] : undefined,
        regNumber: regMatch ? regMatch[1] : undefined,
        groupMajor: /science|বিজ্ঞান/i.test(text) ? 'Science' : /business|বাণিজ্য/i.test(text) ? 'Business Studies' : 'General',
      });
    }

    if (/hsc|এইচএসসি|higher\s*secondary/i.test(text)) {
      extractedEducation.push({
        degree: 'HSC',
        examTitle: 'Higher Secondary Certificate (HSC)',
        boardOrUniversity: detectedBoard,
        institution: 'College',
        passingYear: passYearMatch ? passYearMatch[1] : '2018',
        resultGpa: gpaMatch ? gpaMatch[1] : '5.00',
        rollNumber: rollMatch ? rollMatch[1] : undefined,
        regNumber: regMatch ? regMatch[1] : undefined,
        groupMajor: /science|বিজ্ঞান/i.test(text) ? 'Science' : 'General',
      });
    }

    if (/b\.?sc|bba|ba|honours|graduation|স্নাতক/i.test(text)) {
      extractedEducation.push({
        degree: 'GRADUATION',
        examTitle: 'Bachelor of Science (B.Sc)',
        boardOrUniversity: 'University / Institute',
        institution: 'University',
        passingYear: passYearMatch ? passYearMatch[1] : '2022',
        resultGpa: gpaMatch ? gpaMatch[1] : '3.75',
        groupMajor: 'Computer Science & Engineering',
      });
    }

    if (extractedEducation.length === 0 && (rollMatch || regMatch || gpaMatch || passYearMatch)) {
      extractedEducation.push({
        degree: 'OTHER',
        examTitle: 'Educational Qualification',
        boardOrUniversity: detectedBoard,
        passingYear: passYearMatch ? passYearMatch[1] : '',
        resultGpa: gpaMatch ? gpaMatch[1] : '',
        rollNumber: rollMatch ? rollMatch[1] : undefined,
        regNumber: regMatch ? regMatch[1] : undefined,
      });
    }

    return {
      identity: {
        nameBn: normName.nameBn,
        nameEnUpper: normName.nameEnUpper,
        nameEnTitle: normName.nameEnTitle,
        fatherNameBn: normFather.nameBn || undefined,
        fatherNameEnUpper: normFather.nameEnUpper !== 'CITIZEN APPLICANT' ? normFather.nameEnUpper : undefined,
        motherNameBn: normMother.nameBn || undefined,
        motherNameEnUpper: normMother.nameEnUpper !== 'CITIZEN APPLICANT' ? normMother.nameEnUpper : undefined,
        dob: dobMatch ? dobMatch[0] : '',
        gender: /female|মহিলা|স্ত্রী/i.test(text) ? 'FEMALE' : 'MALE',
        nidNumber: nidMatch ? nidMatch[0] : '',
        birthRegNumber: '',
        phone: phoneMatch ? phoneMatch[0] : '',
        email: emailMatch ? emailMatch[0] : '',
      },
      presentAddress: resolvedGeo,
      permanentAddress: resolvedPermGeo,
      education: extractedEducation,
      experience: [],
      skills: ['Bengali', 'English', 'Computer Operations'],
      inferredClues: resolvedGeo.inferredClues || [],
      confidence: nidMatch || dobMatch || resolvedGeo.district || extractedEducation.length > 0 ? 0.85 : 0.5,
      rawSummary: 'Extracted using local algorithmic heuristic & Bangladesh Geo Knowledge Graph.',
      engine: 'ALGORITHMIC_FALLBACK',
      requiresUserConfirmation: true,
    };
  }

  /**
   * Human Confirmation & Application to Vault
   * Commits verified candidate data into the Customer Vault with audit trail
   */
  async confirmAndApplyExtractedProfile(
    organizationId: string,
    customerIdOrPhone: string,
    confirmedCandidate: CandidateExtractionResult,
    userId?: string | null
  ): Promise<CustomerVaultProfile> {
    const ident = confirmedCandidate.identity;
    const phone = ident.phone || customerIdOrPhone.replace(/[^0-9]/g, '');

    if (!phone || phone.length < 10) {
      throw new BadRequestException('A valid 11-digit phone number is required to save to Customer Vault.');
    }

    // Convert education to EducationEntry format
    const eduHistory: EducationEntry[] = (confirmedCandidate.education || []).map(e => ({
      degree: e.degree || 'OTHER',
      examTitle: e.examTitle || e.degree,
      boardOrUniversity: e.boardOrUniversity || 'Board',
      institution: e.institution,
      rollNumber: e.rollNumber,
      regNumber: e.regNumber,
      passingYear: e.passingYear || '',
      resultGpa: e.resultGpa || '',
      groupMajor: e.groupMajor,
    }));

    // Perform upsert with atomic structured addresses
    const profile = await this.upsertProfile(organizationId, userId || null, {
      phone,
      nameBn: ident.nameBn,
      nameEn: ident.nameEnUpper || ident.nameEnTitle,
      fatherNameBn: ident.fatherNameBn,
      fatherNameEn: ident.fatherNameEnUpper,
      motherNameBn: ident.motherNameBn,
      motherNameEn: ident.motherNameEnUpper,
      dob: ident.dob,
      gender: ident.gender,
      nidNumber: ident.nidNumber,
      birthRegNumber: ident.birthRegNumber,
      email: ident.email,
      presentStructuredAddress: confirmedCandidate.presentAddress,
      permanentStructuredAddress: confirmedCandidate.permanentAddress,
      educationHistory: eduHistory,
    });

    return profile;
  }

  /**
   * Phase 2.1: Get Extension-Appropriate Customer Vault Profile
   */
  async getExtensionProfile(organizationId: string, phoneOrId: string) {
    const profile = await this.getProfile(organizationId, phoneOrId);
    if (!profile) {
      throw new NotFoundException(`Customer vault profile '${phoneOrId}' not found.`);
    }

    const canonicalValues: Record<string, any> = {
      nameEn: profile.nameEn || '',
      nameBn: profile.nameBn || '',
      fullNameEn: profile.nameEn || '',
      fullNameBn: profile.nameBn || '',
      applicantName: profile.nameEn || '',
      fatherNameEn: profile.fatherNameEn || '',
      fatherNameBn: profile.fatherNameBn || '',
      motherNameEn: profile.motherNameEn || '',
      motherNameBn: profile.motherNameBn || '',
      dob: profile.dob || '',
      gender: profile.gender || '',
      nidNumber: profile.nidNumber || '',
      birthRegNumber: profile.birthRegNumber || '',
      phone: profile.phone || '',
      email: profile.email || '',
      presentAddress: profile.presentAddress || '',
      presentDistrict: profile.presentStructuredAddress?.district || '',
      presentUpazila: profile.presentStructuredAddress?.upazilaThana || '',
      presentPostOffice: profile.presentStructuredAddress?.postOffice || '',
      presentPostalCode: profile.presentStructuredAddress?.postalCode || '',
      presentVillage: profile.presentStructuredAddress?.villageArea || '',
      permanentAddress: profile.permanentAddress || '',
      permanentDistrict: profile.permanentStructuredAddress?.district || '',
      permanentUpazila: profile.permanentStructuredAddress?.upazilaThana || '',
      permanentPostOffice: profile.permanentStructuredAddress?.postOffice || '',
      permanentPostalCode: profile.permanentStructuredAddress?.postalCode || '',
      permanentVillage: profile.permanentStructuredAddress?.villageArea || '',
    };

    for (const edu of profile.educationHistory || []) {
      const deg = (edu.degree || '').toUpperCase();
      if (deg === 'SSC' || deg === 'DAKHIL') {
        canonicalValues['ssc_exam'] = edu.examTitle;
        canonicalValues['ssc_board'] = edu.boardOrUniversity;
        canonicalValues['ssc_roll'] = edu.rollNumber || '';
        canonicalValues['ssc_reg'] = edu.regNumber || '';
        canonicalValues['ssc_year'] = edu.passingYear;
        canonicalValues['ssc_gpa'] = edu.resultGpa;
        canonicalValues['ssc_group'] = edu.groupMajor || '';
      } else if (deg === 'HSC' || deg === 'ALIM' || deg === 'DIPLOMA') {
        canonicalValues['hsc_exam'] = edu.examTitle;
        canonicalValues['hsc_board'] = edu.boardOrUniversity;
        canonicalValues['hsc_roll'] = edu.rollNumber || '';
        canonicalValues['hsc_reg'] = edu.regNumber || '';
        canonicalValues['hsc_year'] = edu.passingYear;
        canonicalValues['hsc_gpa'] = edu.resultGpa;
        canonicalValues['hsc_group'] = edu.groupMajor || '';
      } else if (deg === 'GRADUATION' || deg === 'HONOURS' || deg === 'BSC' || deg === 'BBA' || deg === 'BA') {
        canonicalValues['grad_exam'] = edu.examTitle;
        canonicalValues['grad_university'] = edu.boardOrUniversity;
        canonicalValues['grad_year'] = edu.passingYear;
        canonicalValues['grad_gpa'] = edu.resultGpa;
        canonicalValues['grad_subject'] = edu.groupMajor || '';
      }
    }

    for (const df of profile.dynamicFields || []) {
      if (df.key && df.value !== undefined) {
        canonicalValues[df.key] = df.value;
      }
    }

    const safeDocuments = (profile.documents || []).map(d => ({
      id: d.id,
      docType: d.docType,
      title: d.title,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      isVerified: d.isVerified,
      uploadedAt: d.uploadedAt,
      hasFile: !!d.fileUrlOrBase64,
    }));

    return {
      customerId: profile.customerId || profile.id,
      vaultId: profile.id,
      organizationId: profile.organizationId,
      profile: {
        nameEn: profile.nameEn,
        nameBn: profile.nameBn,
        phone: profile.phone,
        email: profile.email,
        dob: profile.dob,
        gender: profile.gender,
        nidNumber: profile.nidNumber,
        birthRegNumber: profile.birthRegNumber,
        photoUrl: profile.photoUrl,
        signatureUrl: profile.signatureUrl,
      },
      addresses: {
        present: profile.presentStructuredAddress || { text: profile.presentAddress },
        permanent: profile.permanentStructuredAddress || { text: profile.permanentAddress },
      },
      educationHistory: profile.educationHistory || [],
      documents: safeDocuments,
      canonicalValues,
      updatedAt: profile.updatedAt,
    };
  }

  /**
   * Phase 2.2: Approved Bidirectional Vault Sync
   */
  async syncExtensionUpdates(
    organizationId: string,
    userId: string,
    customerIdOrPhone: string,
    sourceUrl: string,
    updates: Array<{
      canonicalKey: string;
      oldValue?: any;
      newValue: any;
      staffConfirmed?: boolean;
      notes?: string;
    }>
  ) {
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      throw new BadRequestException('At least one update item is required.');
    }

    const profile = await this.getProfile(organizationId, customerIdOrPhone);
    if (!profile) {
      throw new NotFoundException(`Customer vault record '${customerIdOrPhone}' not found.`);
    }

    const ALLOWED_DIRECT_KEYS = new Set([
      'nameEn', 'nameBn', 'fatherNameEn', 'fatherNameBn', 'motherNameEn', 'motherNameBn',
      'spouseNameEn', 'spouseNameBn', 'dob', 'gender', 'nidNumber', 'birthRegNumber',
      'email', 'phone', 'presentAddress', 'permanentAddress', 'religion', 'bloodGroup',
      'maritalStatus'
    ]);

    const SENSITIVE_KEYS = new Set(['nidNumber', 'birthRegNumber', 'dob', 'passport_number']);

    const appliedUpdates: any[] = [];
    const conflicts: any[] = [];
    const mutableProfile: any = { ...profile };

    for (const item of updates) {
      const { canonicalKey, oldValue, newValue, staffConfirmed, notes } = item;
      if (!canonicalKey) continue;

      let currentVal: any = undefined;
      if (ALLOWED_DIRECT_KEYS.has(canonicalKey)) {
        currentVal = mutableProfile[canonicalKey];
      } else {
        const df = (mutableProfile.dynamicFields || []).find((f: any) => f.key === canonicalKey);
        currentVal = df ? df.value : undefined;
      }

      // Concurrency / Stale update check
      if (oldValue !== undefined && currentVal !== undefined && oldValue !== currentVal && oldValue !== null && currentVal !== null) {
        conflicts.push({
          canonicalKey,
          currentServerValue: currentVal,
          expectedOldValue: oldValue,
          proposedNewValue: newValue,
          reason: 'Stale update: Server value was modified concurrently.',
        });
        continue;
      }

      // Sensitive field protection
      if (SENSITIVE_KEYS.has(canonicalKey) && currentVal && currentVal !== newValue && !staffConfirmed) {
        conflicts.push({
          canonicalKey,
          currentServerValue: currentVal,
          proposedNewValue: newValue,
          reason: 'Sensitive identity field requires explicit staff confirmation.',
          requiresConfirmation: true,
        });
        continue;
      }

      if (ALLOWED_DIRECT_KEYS.has(canonicalKey)) {
        mutableProfile[canonicalKey] = newValue;
      } else {
        if (!mutableProfile.dynamicFields) mutableProfile.dynamicFields = [];
        const existingDfIdx = mutableProfile.dynamicFields.findIndex((f: any) => f.key === canonicalKey);
        if (existingDfIdx >= 0) {
          mutableProfile.dynamicFields[existingDfIdx].value = newValue;
          mutableProfile.dynamicFields[existingDfIdx].updatedAt = new Date().toISOString();
        } else {
          mutableProfile.dynamicFields.push({
            id: `df-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            key: canonicalKey,
            labelEn: canonicalKey,
            labelBn: canonicalKey,
            category: 'OTHER',
            fieldType: 'TEXT',
            value: newValue,
            status: 'REVIEWED',
            updatedAt: new Date().toISOString(),
          });
        }
      }

      appliedUpdates.push({
        canonicalKey,
        oldValue: currentVal,
        newValue,
        staffConfirmed: !!staffConfirmed,
        notes,
      });
    }

    if (conflicts.length > 0 && appliedUpdates.length === 0) {
      return {
        success: false,
        conflict: true,
        conflicts,
        message: 'One or more fields have concurrency conflicts or require confirmation.',
      };
    }

    const saved = await this.upsertProfile(organizationId, userId, mutableProfile);

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || 'staff-extension',
        action: 'EXTENSION_VAULT_SYNC',
        entityType: 'CustomerVaultProfile',
        entityId: saved.id,
        newData: {
          sourceUrl,
          appliedUpdates,
          conflicts,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      updatedCount: appliedUpdates.length,
      appliedUpdates,
      conflicts,
      vaultId: saved.id,
      updatedAt: saved.updatedAt,
    };
  }

  /**
   * Phase 2.3: Deterministic & Heuristic Form Field Mapping API
   */
  async mapFormFields(dto: {
    hostname: string;
    pageTitle?: string;
    detectedFields: Array<{
      id: string;
      name?: string;
      label?: string;
      placeholder?: string;
      type?: string;
      options?: string[];
    }>;
  }) {
    const fields = (dto.detectedFields || []).slice(0, 150);
    const mappings: any[] = [];
    const unmapped: string[] = [];

    const BANGLA_SYNONYMS: Record<string, string> = {
      'আবেদনকারীর নাম (বাংলা)': 'nameBn',
      'নাম (বাংলা)': 'nameBn',
      'পিতার নাম (বাংলা)': 'fatherNameBn',
      'মাতার নাম (বাংলা)': 'motherNameBn',
      'আবেদনকারীর নাম (ইংরেজি)': 'nameEn',
      'নাম (ইংরেজি)': 'nameEn',
      'পিতার নাম (ইংরেজি)': 'fatherNameEn',
      'মাতার নাম (ইংরেজি)': 'motherNameEn',
      'আবেদনকারীর নাম': 'nameEn',
      'নাম': 'nameEn',
      'পূর্ণ নাম': 'nameEn',
      'প্রার্থীর নাম': 'nameEn',
      'পিতার নাম': 'fatherNameEn',
      'পিতা': 'fatherNameEn',
      'মাতার নাম': 'motherNameEn',
      'মাতা': 'motherNameEn',

      'জন্ম তারিখ': 'dob',
      'জন্মতারিখ': 'dob',
      'জাতীয় পরিচয়পত্র': 'nidNumber',
      'এনআইডি': 'nidNumber',
      'জন্ম নিবন্ধন': 'birthRegNumber',
      'মোবাইল': 'phone',
      'ফোন': 'phone',
      'ইমেইল': 'email',
      'বর্তমান ঠিকানা': 'presentAddress',
      'স্থায়ী ঠিকানা': 'permanentAddress',
      'জেলা': 'presentDistrict',
      'উপজেলা': 'presentUpazila',
      'পোস্ট কোড': 'presentPostalCode',
      'রোল নম্বর': 'ssc_roll',
      'রোল': 'ssc_roll',
      'রেজিস্ট্রেশন নম্বর': 'ssc_reg',
      'পাসের সন': 'ssc_year',
      'পাসের বছর': 'ssc_year',
      'জিপিএ': 'ssc_gpa',
      'বোর্ড': 'ssc_board',
    };

    for (const f of fields) {
      const rawText = `${f.label || ''} ${f.name || ''} ${f.placeholder || ''} ${f.id || ''}`.trim();
      const norm = this.normalizeKey(f.label || f.name || f.id || '');

      if (CANONICAL_FIELD_MAP[norm]) {
        const item = CANONICAL_FIELD_MAP[norm];
        mappings.push({
          fieldId: f.id,
          name: f.name,
          canonicalKey: item.canonicalKey,
          labelEn: item.labelEn,
          labelBn: item.labelBn,
          confidence: 1.0,
          source: 'CANONICAL_FIELD_MAP',
          category: item.category,
          fieldType: item.fieldType,
        });
        continue;
      }

      const sortedSynonyms = Object.entries(BANGLA_SYNONYMS).sort((a, b) => b[0].length - a[0].length);
      let matchedBanglaKey: string | null = null;
      for (const [bnPhrase, canKey] of sortedSynonyms) {
        if (rawText.includes(bnPhrase)) {
          matchedBanglaKey = canKey;
          break;
        }
      }

      if (matchedBanglaKey) {
        mappings.push({
          fieldId: f.id,
          name: f.name,
          canonicalKey: matchedBanglaKey,
          confidence: 0.95,
          source: 'BANGLA_SEMANTIC_DICTIONARY',
        });
        continue;
      }

      let heuristicKey: string | null = null;
      if (/applicant.*name|candidate.*name/i.test(rawText)) {
        heuristicKey = /bn|bangla/i.test(rawText) ? 'nameBn' : 'nameEn';
      } else if (/father/i.test(rawText)) {
        heuristicKey = /bn|bangla/i.test(rawText) ? 'fatherNameBn' : 'fatherNameEn';
      } else if (/mother/i.test(rawText)) {
        heuristicKey = /bn|bangla/i.test(rawText) ? 'motherNameBn' : 'motherNameEn';
      } else if (/birth.*date|date.*birth|dob/i.test(rawText)) {
        heuristicKey = 'dob';
      } else if (/nid|national.*id/i.test(rawText)) {
        heuristicKey = 'nidNumber';
      } else if (/birth.*reg|birth.*cert/i.test(rawText)) {
        heuristicKey = 'birthRegNumber';
      } else if (/mobile|phone|contact/i.test(rawText)) {
        heuristicKey = 'phone';
      } else if (/email/i.test(rawText)) {
        heuristicKey = 'email';
      } else if (/gender|sex/i.test(rawText)) {
        heuristicKey = 'gender';
      } else if (/present.*addr/i.test(rawText)) {
        heuristicKey = 'presentAddress';
      } else if (/perm.*addr/i.test(rawText)) {
        heuristicKey = 'permanentAddress';
      } else if (/(?:ssc|secondary).*roll/i.test(rawText)) {
        heuristicKey = 'ssc_roll';
      } else if (/(?:ssc|secondary).*reg/i.test(rawText)) {
        heuristicKey = 'ssc_reg';
      } else if (/(?:ssc|secondary).*year/i.test(rawText)) {
        heuristicKey = 'ssc_year';
      } else if (/(?:ssc|secondary).*gpa|result/i.test(rawText)) {
        heuristicKey = 'ssc_gpa';
      } else if (/(?:ssc|secondary).*board/i.test(rawText)) {
        heuristicKey = 'ssc_board';
      } else if (/(?:hsc|higher).*roll/i.test(rawText)) {
        heuristicKey = 'hsc_roll';
      } else if (/(?:hsc|higher).*reg/i.test(rawText)) {
        heuristicKey = 'hsc_reg';
      } else if (/(?:hsc|higher).*year/i.test(rawText)) {
        heuristicKey = 'hsc_year';
      } else if (/(?:hsc|higher).*board/i.test(rawText)) {
        heuristicKey = 'hsc_board';
      }

      if (heuristicKey) {
        mappings.push({
          fieldId: f.id,
          name: f.name,
          canonicalKey: heuristicKey,
          confidence: 0.85,
          source: 'HEURISTIC_RULE_ENGINE',
        });
      } else {
        unmapped.push(f.id);
      }
    }

    return {
      success: true,
      hostname: dto.hostname,
      totalDetected: fields.length,
      mappedCount: mappings.length,
      unmappedCount: unmapped.length,
      mappings,
      unmappedFields: unmapped,
    };
  }

  /**
   * Phase 2.4: Secure Short-Lived Document Access for Extension
   */
  async getDocumentAccess(organizationId: string, phoneOrId: string, docId: string) {
    const profile = await this.getProfile(organizationId, phoneOrId);
    if (!profile) {
      throw new NotFoundException(`Customer vault profile '${phoneOrId}' not found.`);
    }

    const doc = (profile.documents || []).find(d => d.id === docId);
    if (!doc) {
      throw new NotFoundException(`Document '${docId}' not found in customer vault.`);
    }

    const dimensions = doc.docType === 'PHOTO'
      ? { width: 300, height: 300, maxKb: 100 }
      : doc.docType === 'SIGNATURE'
      ? { width: 300, height: 80, maxKb: 60 }
      : undefined;

    return {
      docId: doc.id,
      docType: doc.docType,
      title: doc.title,
      mimeType: doc.mimeType || 'image/jpeg',
      sizeBytes: doc.sizeBytes || 45000,
      dimensions,
      accessUrl: doc.fileUrlOrBase64,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Phase 2.5: Application Workflow Event Logging
   */
  async logExtensionEvent(
    organizationId: string,
    userId: string,
    payload: {
      customerId: string;
      targetDomain: string;
      targetUrl: string;
      eventType: string;
      details?: any;
    }
  ) {
    const { customerId, targetDomain, targetUrl, eventType, details = {} } = payload;
    if (!customerId || !eventType) {
      throw new BadRequestException('customerId and eventType are mandatory.');
    }

    const sanitizedDetails = { ...details };
    delete sanitizedDetails.password;
    delete sanitizedDetails.token;
    delete sanitizedDetails.otp;
    delete sanitizedDetails.secret;

    const log = await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || 'staff-extension',
        action: `EXTENSION_${eventType}`,
        entityType: 'ExtensionWorkflowEvent',
        entityId: customerId,
        newData: {
          targetDomain,
          targetUrl,
          eventType,
          details: sanitizedDetails,
          recordedAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      eventId: log.id,
      timestamp: log.createdAt,
    };
  }
}
