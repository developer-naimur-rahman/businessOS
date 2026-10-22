import { Injectable, Logger, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CustomerVaultService } from './customer-vault.service';
import { PrintQueueService } from './print-queue.service';
import { NotificationService } from '../common/notifications/notification.service';

export type DocumentCategory = 
  | 'CAREER_JOB' 
  | 'BUSINESS_PROPOSAL' 
  | 'LETTERS_FORMS' 
  | 'STUDENT_ACADEMIC';

export type DocumentServiceMode = 'TEMPLATE_BASED' | 'CUSTOM_MADE';

export interface DocumentTemplateConfig {
  id: string;
  category: DocumentCategory;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  languageSupport: 'BN' | 'EN' | 'BILINGUAL';
  pageOrientation: 'PORTRAIT' | 'LANDSCAPE';
  pageSize: 'A4' | 'LEGAL';
  isPublished: boolean;
  isCustomerSelfService: boolean;
  isStaffOnly: boolean;
  basePriceBdt: number;
  customDesignPriceBdt: number;
  version: string;
  requiredFields: string[];
  optionalFields: string[];
  featuresBn: string[];
  featuresEn: string[];
}

export interface UniversalDocumentOrder {
  id: string;
  orderNumber: string; // e.g. DOC-2026-1048
  organizationId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  category: DocumentCategory;
  templateId: string;
  templateTitleBn: string;
  templateTitleEn: string;
  serviceMode: DocumentServiceMode;
  language: 'BN' | 'EN' | 'BILINGUAL';
  
  // Layer B Immutable Document Snapshot (Preserves exact content used)
  snapshotData: {
    nameBn?: string;
    nameEn?: string;
    titleBn?: string;
    titleEn?: string;
    phone?: string;
    email?: string;
    address?: string;
    dob?: string;
    fatherName?: string;
    motherName?: string;
    nationality?: string;
    religion?: string;
    maritalStatus?: string;
    summaryBn?: string;
    summaryEn?: string;
    education?: Array<{
      degree: string;
      institution: string;
      boardOrUniversity?: string;
      passingYear: string;
      resultGpa: string;
    }>;
    experience?: Array<{
      company: string;
      designation: string;
      startDate: string;
      endDate: string;
      isCurrent?: boolean;
      responsibilities: string;
    }>;
    skills?: string[];
    languages?: string[];
    certifications?: string[];
    references?: string;
    customFields?: Record<string, any>;
    customRequirementsNotes?: string;
  };

  financials: {
    basePriceBdt: number;
    customDesignFeeBdt: number;
    printingFeeBdt: number;
    discountBdt: number;
    totalAmountBdt: number;
    paidAmountBdt: number;
    dueAmountBdt: number;
  };

  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  paymentMethod?: 'CASH' | 'BKASH' | 'NAGAD' | 'ONLINE_GATEWAY' | 'BAKI';
  
  fulfillmentStatus: 
    | 'DRAFT' 
    | 'PENDING_APPROVAL' 
    | 'IN_PROGRESS' 
    | 'READY_FOR_DELIVERY' 
    | 'DELIVERED' 
    | 'CANCELLED';

  watermarkRemoved: boolean;
  downloadToken: string;

  printFulfillment?: {
    requested: boolean;
    printTokenNumber?: string;
    copies: number;
    colorMode: 'BLACK_WHITE' | 'FULL_COLOR';
    paperSize: 'A4' | 'LEGAL';
    binding: 'NONE' | 'SPIRAL' | 'LAMINATION';
  };

  customWorkDetails?: {
    assignedStaffName?: string;
    deliveryDeadline?: string;
    revisionsRemaining: number;
    quotationStatus: 'ESTIMATED' | 'ACCEPTED_BY_CUSTOMER' | 'REJECTED';
    deliverableUrl?: string;
    deliverableTitle?: string;
  };

  revisionHistory: Array<{
    revNumber: number;
    timestamp: string;
    modifiedBy: string;
    notes?: string;
  }>;

  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_UNIVERSAL_TEMPLATES: DocumentTemplateConfig[] = [
  // 1. CAREER & JOB
  {
    id: 'minimal-clean',
    category: 'CAREER_JOB',
    titleBn: 'মিনিমাল ক্লিন সিভি ও রিজিউম',
    titleEn: 'Minimal Clean Professional Resume',
    descriptionBn: 'সহজ, আধুনিক ও সংক্ষিপ্ত এক পৃষ্ঠার রিজিউম যা আন্তর্জাতিক মানের রিক্রুটারদের নজর কাড়ে।',
    descriptionEn: 'Ultra-clean single-page resume layout designed for modern tech and corporate roles.',
    languageSupport: 'BILINGUAL',
    pageOrientation: 'PORTRAIT',
    pageSize: 'A4',
    isPublished: true,
    isCustomerSelfService: true,
    isStaffOnly: false,
    basePriceBdt: 50,
    customDesignPriceBdt: 400,
    version: '1.0.0',
    requiredFields: ['nameEn', 'phone', 'summaryEn'],
    optionalFields: ['email', 'address', 'education', 'experience', 'skills'],
    featuresBn: ['মিনিমাল টাইপোগ্রাফি', 'A4 সিঙ্গেল পেজ স্ট্যান্ডার্ড', 'বাংলা ও ইংরেজি সাপোর্ট'],
    featuresEn: ['Minimal typography', 'Single-page A4 standard', 'Dual language ready'],
  },
  {
    id: 'corporate-modern',
    category: 'CAREER_JOB',
    titleBn: 'কর্পোরেট এক্সিকিউটিভ কারিকুলাম ভিটা (CV)',
    titleEn: 'Corporate Modern Executive CV',
    descriptionBn: 'অভিজ্ঞ প্রফেশনাল ও কর্পোরেট পদের জন্য আকর্ষণীয় সাইডবার ও কালার প্যালেটযুক্ত সিভি।',
    descriptionEn: 'Polished executive layout featuring stylish sidebar, skills rating, and achievements.',
    languageSupport: 'BILINGUAL',
    pageOrientation: 'PORTRAIT',
    pageSize: 'A4',
    isPublished: true,
    isCustomerSelfService: true,
    isStaffOnly: false,
    basePriceBdt: 100,
    customDesignPriceBdt: 600,
    version: '1.1.0',
    requiredFields: ['nameEn', 'phone', 'email', 'experience'],
    optionalFields: ['education', 'skills', 'certifications', 'references'],
    featuresBn: ['কর্পোরেট সাইডবার প্যালেট', 'স্কিলস ও প্রোজেক্টস হাইলাইট', 'প্রফেশনাল সামারি'],
    featuresEn: ['Corporate sidebar grid', 'Skills & projects showcase', 'Executive summary'],
  },
  {
    id: 'bangla-academic',
    category: 'CAREER_JOB',
    titleBn: 'বাংলা একাডেমিক ও প্রথাগত বায়োডাটা',
    titleEn: 'Bangla Academic & Traditional Bio-Data',
    descriptionBn: 'সরকারি, বেসরকারি ও একাডেমিক প্রতিষ্ঠানে জমাদানের জন্য প্রমিত বাংলা ছকে বায়োডাটা।',
    descriptionEn: 'Standard academic and traditional biodata formatted in structured Bengali tables.',
    languageSupport: 'BN',
    pageOrientation: 'PORTRAIT',
    pageSize: 'A4',
    isPublished: true,
    isCustomerSelfService: true,
    isStaffOnly: false,
    basePriceBdt: 50,
    customDesignPriceBdt: 350,
    version: '1.0.0',
    requiredFields: ['nameBn', 'fatherName', 'motherName', 'dob', 'address'],
    optionalFields: ['education', 'phone', 'religion', 'maritalStatus'],
    featuresBn: ['শুদ্ধ বাংলা টেবিল ফরম্যাট', 'পিতা-মাতার নাম ও স্থায়ী ঠিকানা', 'জাতীয় পরিচয়পত্র রেফারেন্স'],
    featuresEn: ['Standard Bangla table format', 'Parental & permanent address', 'NID reference'],
  },
  {
    id: 'ats-friendly',
    category: 'CAREER_JOB',
    titleBn: 'এটিএস-ফ্রেন্ডলি টেক অ্যান্ড করপোরেট সিভি',
    titleEn: 'ATS-Friendly Clean Tech Resume',
    descriptionBn: 'অটোমেটেড অ্যাপ্লিকেন্ট ট্র্যাকিং সিস্টেম (ATS) সফটওয়্যার উপযোগী একক কলাম ফরম্যাট।',
    descriptionEn: 'Single column, parser-friendly clean hierarchy optimized for ATS screeners.',
    languageSupport: 'EN',
    pageOrientation: 'PORTRAIT',
    pageSize: 'A4',
    isPublished: true,
    isCustomerSelfService: true,
    isStaffOnly: false,
    basePriceBdt: 80,
    customDesignPriceBdt: 500,
    version: '1.0.0',
    requiredFields: ['nameEn', 'email', 'experience', 'skills'],
    optionalFields: ['education', 'phone', 'certifications'],
    featuresBn: ['১০০% এটিএস ফ্রেন্ডলি পার্সিং', 'হাই-কনভার্সন কীওয়ার্ড স্ট্রাকচার', 'নো-টেবিল টেক্সট ফ্লো'],
    featuresEn: ['100% ATS parser compliant', 'Keyword focused structure', 'Clean text hierarchy'],
  },
  {
    id: 'cover-letter-pro',
    category: 'CAREER_JOB',
    titleBn: 'প্রফেশনাল জব কভার লেটার ও আবেদনপত্র',
    titleEn: 'Professional Job Cover Letter',
    descriptionBn: 'চাকরির আবেদনের জন্য নির্দিষ্ট পদ ও প্রতিষ্ঠানের লক্ষ্য অনুযায়ী রচিত আকর্ষণীয় কভার লেটার।',
    descriptionEn: 'Persuasive job application cover letter formatted with formal corporate letterhead.',
    languageSupport: 'BILINGUAL',
    pageOrientation: 'PORTRAIT',
    pageSize: 'A4',
    isPublished: true,
    isCustomerSelfService: true,
    isStaffOnly: false,
    basePriceBdt: 50,
    customDesignPriceBdt: 300,
    version: '1.0.0',
    requiredFields: ['nameEn', 'phone', 'summaryEn'],
    optionalFields: ['email', 'address'],
    featuresBn: ['ফর্মাল হেডার ও ডেট স্ট্যাম্প', 'অভিজ্ঞতা ও দক্ষতার সংযোগ', 'রেডি-টু-প্রিন্ট মার্জিন'],
    featuresEn: ['Formal letterhead & date stamp', 'Targeted role alignment', 'Ready to print margins'],
  },

  // 2. BUSINESS & PROPOSALS
  {
    id: 'company-profile',
    category: 'BUSINESS_PROPOSAL',
    titleBn: 'এক্সিকিউটিভ কোম্পানি প্রোফাইল',
    titleEn: 'Executive Company Profile',
    descriptionBn: 'ব্যবসা ও কর্পোরেট ক্লায়েন্টদের জন্য কোম্পানির পরিচিতি, মিশন, ভিশন ও সেবা সম্বলিত প্রোফাইল।',
    descriptionEn: 'High-impact corporate overview including mission, vision, services, and client testimonials.',
    languageSupport: 'BILINGUAL',
    pageOrientation: 'PORTRAIT',
    pageSize: 'A4',
    isPublished: true,
    isCustomerSelfService: true,
    isStaffOnly: false,
    basePriceBdt: 250,
    customDesignPriceBdt: 1200,
    version: '1.0.0',
    requiredFields: ['nameEn', 'phone', 'summaryEn'],
    optionalFields: ['email', 'address', 'skills'],
    featuresBn: ['মাল্টি-সেকশন বিজনেস আর্কিটেকচার', 'ক্লায়েন্ট পোর্টফোলিও শোকেস', 'ব্র্যান্ডেড টাইটেল ডিজাইন'],
    featuresEn: ['Multi-section business overview', 'Client portfolio showcase', 'Branded cover design'],
  },
  {
    id: 'project-proposal',
    category: 'BUSINESS_PROPOSAL',
    titleBn: 'বিজনেস প্রজেক্ট ও ওয়ার্ক প্রপোজাল',
    titleEn: 'Business Project & Work Proposal',
    descriptionBn: 'টেন্ডার, প্রজেক্ট কন্ট্রাক্ট এবং প্রাতিষ্ঠানিক কাজের চুক্তির জন্য বিশদ কর্মপরিকল্পনা প্রপোজাল।',
    descriptionEn: 'Comprehensive project proposal including scope of work, deliverables, and payment terms.',
    languageSupport: 'BILINGUAL',
    pageOrientation: 'PORTRAIT',
    pageSize: 'A4',
    isPublished: true,
    isCustomerSelfService: true,
    isStaffOnly: false,
    basePriceBdt: 200,
    customDesignPriceBdt: 1000,
    version: '1.0.0',
    requiredFields: ['nameEn', 'summaryEn'],
    optionalFields: ['phone', 'email', 'experience'],
    featuresBn: ['স্কোপ অব ওয়ার্ক টেবিল', 'টাইমলাইন ও মাইলস্টোন ছক', 'পেমেন্ট শর্তাবলি ক্লজ'],
    featuresEn: ['Scope of work table', 'Timeline & milestones', 'Terms & conditions clauses'],
  },
  {
    id: 'business-letterhead',
    category: 'BUSINESS_PROPOSAL',
    titleBn: 'প্রাতিষ্ঠানিক অফিসিয়াল লেটারহেড পেপার',
    titleEn: 'Official Business Letterhead Memo',
    descriptionBn: 'শপ ও অফিসের নোটিশ, ছাড়পত্র বা সমঝোতা প্রকাশের জন্য প্রিমিয়াম ডিজিটাল লেটারহেড।',
    descriptionEn: 'Clean corporate letterhead memo template for official notices, MoUs, and announcements.',
    languageSupport: 'BILINGUAL',
    pageOrientation: 'PORTRAIT',
    pageSize: 'A4',
    isPublished: true,
    isCustomerSelfService: true,
    isStaffOnly: false,
    basePriceBdt: 50,
    customDesignPriceBdt: 250,
    version: '1.0.0',
    requiredFields: ['nameEn'],
    optionalFields: ['phone', 'email', 'address'],
    featuresBn: ['টপ ও বটম ডিজিটাল সিল মার্জিন', 'ওয়াটারমার্ক ব্যাকগ্রাউন্ড অপশন', 'মেমো ও ডেট রেফারেন্স'],
    featuresEn: ['Top & bottom corporate margins', 'Subtle background watermark', 'Memo & ref number header'],
  },

  // 3. LETTERS & FORMS
  {
    id: 'formal-leave-application',
    category: 'LETTERS_FORMS',
    titleBn: 'ছুটি ও অনুপস্থিতির আনুষ্ঠানিক আবেদনপত্র',
    titleEn: 'Formal Leave & Absence Application',
    descriptionBn: 'স্কুল, কলেজ, বিশ্ববিদ্যালয় বা অফিসে ছুটির মঞ্জুরির জন্য বিধি সম্মত ফরম্যাটে আবেদন।',
    descriptionEn: 'Formal leave letter for academic or workplace approval with correct salutation.',
    languageSupport: 'BN',
    pageOrientation: 'PORTRAIT',
    pageSize: 'A4',
    isPublished: true,
    isCustomerSelfService: true,
    isStaffOnly: false,
    basePriceBdt: 30,
    customDesignPriceBdt: 150,
    version: '1.0.0',
    requiredFields: ['nameBn', 'phone', 'summaryBn'],
    optionalFields: ['address'],
    featuresBn: ['যথাযথ প্রমিত সম্ভাষণ', 'ছুটির কারণ ও তারিখের স্পষ্ট ছক', 'স্বাক্ষর ও সুপারিশের জায়গা'],
    featuresEn: ['Formal Bengali salutation', 'Structured absence duration', 'Sign-off and endorsement block'],
  },
  {
    id: 'undertaking-declaration',
    category: 'LETTERS_FORMS',
    titleBn: 'অঙ্গিকারনামা ও ব্যক্তিগত হলফনামা খসড়া',
    titleEn: 'Undertaking & Declaration Draft',
    descriptionBn: 'ভর্তি, ঋণ, দোকান চুক্তি বা অন্যান্য সেবার শর্ত পূরণের জন্য আইনি ভাষা সামঞ্জস্যপূর্ণ অঙ্গিকারনামা।',
    descriptionEn: 'Formal declaration draft suitable for non-judicial stamp paper typing or official submission.',
    languageSupport: 'BN',
    pageOrientation: 'PORTRAIT',
    pageSize: 'LEGAL',
    isPublished: true,
    isCustomerSelfService: true,
    isStaffOnly: false,
    basePriceBdt: 60,
    customDesignPriceBdt: 300,
    version: '1.0.0',
    requiredFields: ['nameBn', 'fatherName', 'dob', 'address'],
    optionalFields: ['nidNumber'],
    featuresBn: ['লিগ্যাল পেপার ও স্ট্যাম্প মার্জিন', 'সাক্ষীগণের বিবরণী ছক', 'শর্তযুক্ত বুলেট পয়েন্ট'],
    featuresEn: ['Legal paper sizing', 'Witness details block', 'Structured clauses'],
  },

  // 4. STUDENT & ACADEMIC
  {
    id: 'student-portfolio',
    category: 'STUDENT_ACADEMIC',
    titleBn: 'শিক্ষার্থী একাডেমিক প্রোফাইল ও স্টেটমেন্ট',
    titleEn: 'Student Academic Profile & SOP',
    descriptionBn: 'উচ্চশিক্ষা, বৃত্তি এবং ইন্টার্নশিপে জমা দেওয়ার জন্য বিস্তারিত ফলাফল ও লক্ষ্যের প্রতিফলন।',
    descriptionEn: 'Comprehensive academic transcript summary, research interests, and scholarship SOP.',
    languageSupport: 'EN',
    pageOrientation: 'PORTRAIT',
    pageSize: 'A4',
    isPublished: true,
    isCustomerSelfService: true,
    isStaffOnly: false,
    basePriceBdt: 80,
    customDesignPriceBdt: 450,
    version: '1.0.0',
    requiredFields: ['nameEn', 'education', 'summaryEn'],
    optionalFields: ['email', 'phone', 'skills', 'certifications'],
    featuresBn: ['জিপিএ ও রেজাল্ট হাইলাইট', 'রিসার্চ ও কো-কারিকুলার সেকশন', 'প্রফেসর রেফারেন্স ফরম্যাট'],
    featuresEn: ['GPA & grades highlight', 'Research & leadership section', 'Professor references'],
  },
];

@Injectable()
export class UniversalDocumentService {
  private readonly logger = new Logger(UniversalDocumentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vaultService: CustomerVaultService,
    private readonly printQueueService: PrintQueueService,
    @Optional() private readonly notificationService?: NotificationService,
  ) {}

  /**
   * Get all universal templates (combines custom organization overrides with defaults)
   */
  async getTemplates(organizationId?: string, category?: string): Promise<DocumentTemplateConfig[]> {
    let templates = [...DEFAULT_UNIVERSAL_TEMPLATES];

    if (organizationId) {
      try {
        const customOverrides = await this.prisma.auditLog.findMany({
          where: {
            organizationId,
            entityType: 'UniversalDocumentTemplateConfig',
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });

        const overrideMap = new Map<string, DocumentTemplateConfig>();
        for (const log of customOverrides) {
          const t = (log.newData as unknown) as DocumentTemplateConfig;
          if (t && t.id && !overrideMap.has(t.id)) {
            overrideMap.set(t.id, t);
          }
        }

        templates = templates.map((def) => overrideMap.get(def.id) || def);
      } catch (err) {
        this.logger.warn(`Could not fetch custom template overrides: ${err.message}`);
      }
    }

    if (category && category !== 'ALL') {
      templates = templates.filter((t) => t.category === category);
    }

    return templates;
  }

  /**
   * Save or update template configuration (pricing, publish status, rules)
   */
  async saveTemplateConfig(organizationId: string, userId: string | null, template: DocumentTemplateConfig) {
    if (!template.id) {
      throw new BadRequestException('Template ID is required.');
    }

    const log = await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'UniversalDocumentTemplateConfig',
        entityId: template.id,
        action: 'UPDATE_TEMPLATE_CONFIG',
        newData: template as any,
      },
    });

    return { success: true, id: log.id, template };
  }

  /**
   * Create a new document order (Mode A: Template-Based or Mode B: Custom-Made)
   * Captures an immutable Layer B snapshot of customer fields
   */
  async createDocumentOrder(
    organizationId: string,
    userId: string | null,
    dto: {
      customerId?: string;
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      category: DocumentCategory;
      templateId: string;
      serviceMode: DocumentServiceMode;
      language?: 'BN' | 'EN' | 'BILINGUAL';
      snapshotData: any;
      paymentStatus?: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
      paymentMethod?: 'CASH' | 'BKASH' | 'NAGAD' | 'ONLINE_GATEWAY' | 'BAKI';
      paidAmountBdt?: number;
      customDesignFeeBdt?: number;
      discountBdt?: number;
      assignedStaffName?: string;
      deliveryDeadline?: string;
      customRequirementsNotes?: string;
      printOptions?: {
        requested: boolean;
        copies?: number;
        colorMode?: 'BLACK_WHITE' | 'FULL_COLOR';
        paperSize?: 'A4' | 'LEGAL';
        binding?: 'NONE' | 'SPIRAL' | 'LAMINATION';
      };
    }
  ): Promise<UniversalDocumentOrder> {
    if (!dto.customerName || !dto.customerPhone) {
      throw new BadRequestException('Customer name and phone number are required.');
    }

    const templates = await this.getTemplates(organizationId);
    const template = templates.find((t) => t.id === dto.templateId) || templates[0];

    const orderNumber = `DOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const downloadToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Pricing calculation
    const basePriceBdt = dto.serviceMode === 'TEMPLATE_BASED' ? template.basePriceBdt : 0;
    const customDesignFeeBdt = dto.serviceMode === 'CUSTOM_MADE' ? Number(dto.customDesignFeeBdt || template.customDesignPriceBdt) : 0;
    
    // Print calculation
    let printingFeeBdt = 0;
    if (dto.printOptions?.requested) {
      const copies = Math.max(1, Number(dto.printOptions.copies || 1));
      const isColor = dto.printOptions.colorMode === 'FULL_COLOR';
      const perPage = isColor ? 20 : 5;
      const extra = dto.printOptions.binding === 'LAMINATION' ? 20 * copies : dto.printOptions.binding === 'SPIRAL' ? 40 : 0;
      printingFeeBdt = (perPage * copies) + extra;
    }

    const discountBdt = Math.max(0, Number(dto.discountBdt || 0));
    const totalAmountBdt = Math.max(0, basePriceBdt + customDesignFeeBdt + printingFeeBdt - discountBdt);
    
    const isPaid = dto.paymentStatus === 'PAID';
    const paidAmountBdt = isPaid ? totalAmountBdt : Math.min(totalAmountBdt, Math.max(0, Number(dto.paidAmountBdt || 0)));
    const dueAmountBdt = Math.max(0, totalAmountBdt - paidAmountBdt);

    const paymentStatus = dueAmountBdt === 0 ? 'PAID' : paidAmountBdt > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
    const watermarkRemoved = paymentStatus === 'PAID';

    // Auto-link to print queue if printing is requested
    let printTokenNumber: string | undefined = undefined;
    if (dto.printOptions?.requested) {
      try {
        const printRes = await this.printQueueService.submitPrintDrop({
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          fileName: `${orderNumber}_${template.id}.pdf`,
          paperSize: dto.printOptions.paperSize || template.pageSize || 'A4',
          colorMode: dto.printOptions.colorMode || 'BLACK_WHITE',
          copies: dto.printOptions.copies || 1,
          bindingOrLamination: (dto.printOptions.binding === 'SPIRAL' || (dto.printOptions.binding as any) === 'SPIRAL_BINDING')
            ? 'SPIRAL_BINDING'
            : dto.printOptions.binding === 'LAMINATION'
            ? 'LAMINATION'
            : 'NONE',
          notes: `Universal Document Studio order: ${orderNumber}`,
        }, organizationId);
        printTokenNumber = printRes.tokenNumber;
      } catch (err) {
        this.logger.warn(`Could not auto-enqueue print drop: ${err.message}`);
      }
    }

    const nowIso = new Date().toISOString();
    const orderData: UniversalDocumentOrder = {
      id: `doc_${Date.now()}`,
      orderNumber,
      organizationId,
      customerId: dto.customerId,
      customerName: dto.customerName.trim(),
      customerPhone: dto.customerPhone.trim(),
      customerEmail: dto.customerEmail?.trim() || undefined,
      category: dto.category || template.category,
      templateId: template.id,
      templateTitleBn: template.titleBn,
      templateTitleEn: template.titleEn,
      serviceMode: dto.serviceMode || 'TEMPLATE_BASED',
      language: dto.language || 'BILINGUAL',
      
      // Immutable Snapshot
      snapshotData: {
        ...dto.snapshotData,
        customRequirementsNotes: dto.customRequirementsNotes || '',
      },

      financials: {
        basePriceBdt,
        customDesignFeeBdt,
        printingFeeBdt,
        discountBdt,
        totalAmountBdt,
        paidAmountBdt,
        dueAmountBdt,
      },

      paymentStatus,
      paymentMethod: dto.paymentMethod || 'CASH',
      
      fulfillmentStatus: dto.serviceMode === 'CUSTOM_MADE' ? 'IN_PROGRESS' : 'READY_FOR_DELIVERY',
      watermarkRemoved,
      downloadToken,

      printFulfillment: {
        requested: Boolean(dto.printOptions?.requested),
        printTokenNumber,
        copies: Number(dto.printOptions?.copies || 1),
        colorMode: dto.printOptions?.colorMode || 'BLACK_WHITE',
        paperSize: dto.printOptions?.paperSize || 'A4',
        binding: dto.printOptions?.binding || 'NONE',
      },

      customWorkDetails: dto.serviceMode === 'CUSTOM_MADE' ? {
        assignedStaffName: dto.assignedStaffName || 'Lead Designer',
        deliveryDeadline: dto.deliveryDeadline || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        revisionsRemaining: 3,
        quotationStatus: 'ESTIMATED',
      } : undefined,

      revisionHistory: [
        {
          revNumber: 1,
          timestamp: nowIso,
          modifiedBy: userId ? 'Staff Operator' : 'Customer Self-Service',
          notes: `Order created (${dto.serviceMode})`,
        },
      ],

      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const record = await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'UniversalDocumentOrder',
        entityId: orderNumber,
        action: 'CREATE_DOCUMENT_ORDER',
        newData: orderData as any,
      },
    });

    orderData.id = record.id;

    // Send email notification via Resend if email provided
    if (orderData.customerEmail && this.notificationService) {
      this.notificationService.notifyCvStudioPurchase({
        customerEmail: orderData.customerEmail,
        customerName: orderData.customerName,
        templateTitle: `${orderData.templateTitleBn} (${orderData.serviceMode})`,
        amountBdt: orderData.financials.paidAmountBdt,
        orderToken: orderData.orderNumber,
      }).catch((e) => this.logger.warn(`Failed to dispatch order email: ${e.message}`));
    }

    return orderData;
  }

  /**
   * Get list of document orders with filtering and metrics
   */
  async getDocumentOrders(organizationId: string, filter?: { category?: string; status?: string; search?: string; serviceMode?: string }) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'UniversalDocumentOrder',
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    let orders: UniversalDocumentOrder[] = logs.map((l) => {
      const data = (l.newData as any) || {};
      return {
        ...data,
        id: l.id,
        createdAt: l.createdAt.toISOString(),
      };
    });

    if (filter?.category && filter.category !== 'ALL') {
      orders = orders.filter((o) => o.category === filter.category);
    }

    if (filter?.serviceMode && filter.serviceMode !== 'ALL') {
      orders = orders.filter((o) => o.serviceMode === filter.serviceMode);
    }

    if (filter?.status && filter.status !== 'ALL') {
      orders = orders.filter((o) => o.fulfillmentStatus === filter.status || o.paymentStatus === filter.status);
    }

    if (filter?.search && filter.search.trim()) {
      const q = filter.search.trim().toLowerCase();
      orders = orders.filter(
        (o) =>
          (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
          (o.customerName && o.customerName.toLowerCase().includes(q)) ||
          (o.customerPhone && o.customerPhone.includes(q)) ||
          (o.templateTitleBn && o.templateTitleBn.toLowerCase().includes(q)) ||
          (o.templateTitleEn && o.templateTitleEn.toLowerCase().includes(q))
      );
    }

    // Analytics summary
    const totalOrders = orders.length;
    const templateBasedCount = orders.filter((o) => o.serviceMode === 'TEMPLATE_BASED').length;
    const customMadeCount = orders.filter((o) => o.serviceMode === 'CUSTOM_MADE').length;
    const totalRevenueBdt = orders.reduce((sum, o) => sum + (Number(o.financials?.paidAmountBdt) || 0), 0);
    const totalDueBdt = orders.reduce((sum, o) => sum + (Number(o.financials?.dueAmountBdt) || 0), 0);
    const pendingFulfillment = orders.filter((o) => ['DRAFT', 'IN_PROGRESS', 'PENDING_APPROVAL'].includes(o.fulfillmentStatus)).length;

    return {
      metrics: {
        totalOrders,
        templateBasedCount,
        customMadeCount,
        totalRevenueBdt,
        totalDueBdt,
        pendingFulfillment,
      },
      orders,
    };
  }

  /**
   * Get single order by ID or orderNumber
   */
  async getOrder(organizationId: string, idOrNumber: string): Promise<UniversalDocumentOrder> {
    const log = await this.prisma.auditLog.findFirst({
      where: {
        organizationId,
        entityType: 'UniversalDocumentOrder',
        OR: [{ id: idOrNumber }, { entityId: idOrNumber }],
      },
    });

    if (!log) {
      throw new NotFoundException('Document order not found.');
    }

    const data = (log.newData as any) || {};
    return {
      ...data,
      id: log.id,
      createdAt: log.createdAt.toISOString(),
    };
  }

  /**
   * Update order status, payment, or staff notes
   */
  async updateOrderStatus(
    organizationId: string,
    userId: string | null,
    idOrNumber: string,
    update: {
      fulfillmentStatus?: UniversalDocumentOrder['fulfillmentStatus'];
      paymentStatus?: UniversalDocumentOrder['paymentStatus'];
      paidAmountBdt?: number;
      assignedStaffName?: string;
      notes?: string;
      deliverableUrl?: string;
      deliverableTitle?: string;
    }
  ) {
    const log = await this.prisma.auditLog.findFirst({
      where: {
        organizationId,
        entityType: 'UniversalDocumentOrder',
        OR: [{ id: idOrNumber }, { entityId: idOrNumber }],
      },
    });

    if (!log) {
      throw new NotFoundException('Document order not found.');
    }

    const current: UniversalDocumentOrder = (log.newData as any) || {};
    const nowIso = new Date().toISOString();

    let newFinancials = { ...current.financials };
    if (update.paidAmountBdt !== undefined) {
      const added = Number(update.paidAmountBdt);
      const newPaid = Math.min(newFinancials.totalAmountBdt, newFinancials.paidAmountBdt + added);
      newFinancials = {
        ...newFinancials,
        paidAmountBdt: newPaid,
        dueAmountBdt: Math.max(0, newFinancials.totalAmountBdt - newPaid),
      };
    }

    const paymentStatus = update.paymentStatus || (newFinancials.dueAmountBdt === 0 ? 'PAID' : current.paymentStatus);
    const watermarkRemoved = paymentStatus === 'PAID' || current.watermarkRemoved;

    const newRev = {
      revNumber: (current.revisionHistory?.length || 1) + 1,
      timestamp: nowIso,
      modifiedBy: userId ? 'Staff' : 'System',
      notes: update.notes || `Status changed to ${update.fulfillmentStatus || current.fulfillmentStatus}`,
    };

    const updated: UniversalDocumentOrder = {
      ...current,
      fulfillmentStatus: update.fulfillmentStatus || current.fulfillmentStatus,
      paymentStatus,
      watermarkRemoved,
      financials: newFinancials,
      customWorkDetails: current.customWorkDetails ? {
        ...current.customWorkDetails,
        assignedStaffName: update.assignedStaffName || current.customWorkDetails.assignedStaffName,
        deliverableUrl: update.deliverableUrl || current.customWorkDetails.deliverableUrl,
        deliverableTitle: update.deliverableTitle || current.customWorkDetails.deliverableTitle,
      } : undefined,
      revisionHistory: [...(current.revisionHistory || []), newRev],
      updatedAt: nowIso,
    };

    await this.prisma.auditLog.update({
      where: { id: log.id },
      data: {
        action: `UPDATE_DOC_ORDER_${updated.fulfillmentStatus}`,
        newData: updated as any,
      },
    });

    return { success: true, order: updated };
  }
}
