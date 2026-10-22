import { DEFAULT_INTERNET_SERVICES } from '../config/internet-services';
import { STATIC_CATALOG } from '../config/static-catalog';

// Helper for unique IDs
const genId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Types
export interface ServiceJob {
  id: string;
  jobNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceCategory: string;
  jobDescription: string;
  deviceOrFileDetails?: string;
  estimatedCostBdt: number;
  advancePaidBdt: number;
  finalCostBdt?: number;
  assignedStaffName?: string;
  status: 'PENDING' | 'RECEIVED' | 'IN_PROGRESS' | 'WAITING_FOR_PARTS' | 'READY_FOR_DELIVERY' | 'DELIVERED' | 'DELIVERED_PAID' | 'CANCELLED';
  promisedDeliveryDate?: string;
  deliverables?: Array<{
    id: string;
    title: string;
    fileUrl: string;
    deliverableType: string;
    uploadedAt: string;
  }>;
  statusHistory?: Array<{
    status: string;
    updatedAt: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceApplication {
  id: string;
  referenceNumber: string;
  serviceSlug: string;
  serviceTitleBn: string;
  serviceTitleEn: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  officialGovtFeeBdt: number;
  shopServiceChargeBdt: number;
  status: 
    | 'DRAFT'
    | 'SUBMITTED_FOR_REVIEW'
    | 'DOCUMENTS_VERIFIED'
    | 'IN_PROGRESS'
    | 'SUBMITTED_TO_AUTHORITY'
    | 'READY_FOR_APPROVAL'
    | 'COMPLETED'
    | 'READY_FOR_PICKUP'
    | 'DELIVERED'
    | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'VERIFIED' | 'REJECTED';
  assignedStaffName?: string;
  formData: Record<string, any>;
  documents?: Array<{
    id: string;
    nameBn: string;
    fileUrl: string;
    type: string;
  }>;
  deliverables?: Array<{
    id: string;
    title: string;
    fileUrl: string;
    deliverableType: string;
    uploadedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PrintQueueItem {
  id: string;
  tokenNumber: string;
  customerName: string;
  customerPhone: string;
  fileName: string;
  fileUrlOrBase64?: string;
  paperSize: string;
  colorMode: string;
  copies: number;
  pageRange?: string;
  bindingOrLamination?: string;
  notes?: string;
  estimatedPriceBdt: number;
  finalCostBdt?: number;
  status: 'QUEUED' | 'WAITING_IN_QUEUE' | 'PRINTING' | 'PRINTING_NOW' | 'READY_FOR_PICKUP' | 'PRINTED_READY' | 'DELIVERED' | 'BILLED_DELIVERED' | 'BILLED_COMPLETED';
  createdAt: string;
  updatedAt: string;
}

// Global in-memory singleton to persist state across Next.js API requests in serverless runtime
declare global {
  // eslint-disable-next-line no-var
  var __businessOS_demo_store: {
    serviceJobs: ServiceJob[];
    serviceApplications: ServiceApplication[];
    printQueue: PrintQueueItem[];
    heldCarts: any[];
    salesHistory: any[];
    expenses: any[];
    cashRegister: {
      openingBalance: number;
      isClosed: boolean;
      closedAt?: string;
      closingData?: any;
    };
    digitalServices: {
      balances: Record<string, number>;
      transactions: any[];
    };
    documentStudio: {
      templates: any[];
      orders: any[];
    };
    serviceScheduling: {
      settings: any;
      appointments: any[];
    };
    customerVault: any[];
    extensionEvents: any[];
  } | undefined;
}

function initStore() {
  if (globalThis.__businessOS_demo_store) {
    return globalThis.__businessOS_demo_store;
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const initialJobs: ServiceJob[] = [
    {
      id: 'job-1001',
      jobNumber: 'JOB-2026-1001',
      customerName: 'Karim Rahman',
      customerPhone: '01812345678',
      customerEmail: 'karim@demo.local',
      serviceCategory: 'Hardware & Motherboard Servicing',
      jobDescription: 'Desktop PC Motherboard no power trigger and short capacitor replacement. Power supply tested OK.',
      deviceOrFileDetails: 'Gigabyte H410M Motherboard + Intel Core i5 10400',
      estimatedCostBdt: 1800,
      advancePaidBdt: 500,
      finalCostBdt: 1800,
      assignedStaffName: 'Naimur (Master Technician)',
      status: 'READY_FOR_DELIVERY',
      promisedDeliveryDate: todayStr,
      deliverables: [
        {
          id: 'del-1',
          title: 'Motherboard Diagnostic & Testing Report',
          fileUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=800',
          deliverableType: 'DELIVERY_CHALLAN',
          uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        }
      ],
      statusHistory: [
        { status: 'PENDING', updatedAt: new Date(Date.now() - 86400000).toISOString(), note: 'Device received at front desk' },
        { status: 'IN_PROGRESS', updatedAt: new Date(Date.now() - 43200000).toISOString(), note: 'Capacitor resoldering in progress' },
        { status: 'READY_FOR_DELIVERY', updatedAt: new Date(Date.now() - 7200000).toISOString(), note: 'Burn-in test passed 2 hours. Ready for customer pickup.' }
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'job-1002',
      jobNumber: 'JOB-2026-1002',
      customerName: 'Salma Begum',
      customerPhone: '0171635679',
      serviceCategory: 'Laptop Servicing & Screen',
      jobDescription: 'HP Pavilion 15.6 inch IPS FHD display replacement due to broken corner and hinge repair.',
      deviceOrFileDetails: 'HP Pavilion 15-eg0025tx (Serial: 5CD1234XYZ)',
      estimatedCostBdt: 4500,
      advancePaidBdt: 2000,
      assignedStaffName: 'Tanvir (Hardware Tech)',
      status: 'IN_PROGRESS',
      promisedDeliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliverables: [],
      statusHistory: [
        { status: 'PENDING', updatedAt: new Date(Date.now() - 72000000).toISOString(), note: 'Screen panel ordered from supplier' },
        { status: 'IN_PROGRESS', updatedAt: new Date(Date.now() - 14400000).toISOString(), note: 'Installing replacement screen' }
      ],
      createdAt: new Date(Date.now() - 72000000).toISOString(),
      updatedAt: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: 'job-1003',
      jobNumber: 'JOB-2026-1003',
      customerName: 'Tanvir Ahmed',
      customerPhone: '01911223344',
      serviceCategory: 'OS & Software Setup',
      jobDescription: 'Genuine Windows 11 64-bit clean install, drivers update, MS Office 2021 setup and antivirus config.',
      deviceOrFileDetails: 'Dell Inspiron 14 5000 Series',
      estimatedCostBdt: 500,
      advancePaidBdt: 500,
      finalCostBdt: 500,
      assignedStaffName: 'Shakil (Software Desk)',
      status: 'DELIVERED_PAID',
      deliverables: [],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'job-1004',
      jobNumber: 'JOB-2026-1004',
      customerName: 'Local High School (Headmaster)',
      customerPhone: '0171974862',
      serviceCategory: 'Printer Servicing & Refill',
      jobDescription: 'Canon Pixma G3010 color ink tank head clog cleaning, roller dust cleanup and waste ink pad reset.',
      deviceOrFileDetails: 'Canon Pixma G3010 Multi-function Printer',
      estimatedCostBdt: 800,
      advancePaidBdt: 0,
      assignedStaffName: 'Naimur (Master Technician)',
      status: 'PENDING',
      promisedDeliveryDate: todayStr,
      deliverables: [],
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      updatedAt: new Date(Date.now() - 14400000).toISOString(),
    }
  ];

  const initialApplications: ServiceApplication[] = [
    {
      id: 'app-8801',
      referenceNumber: 'APP-2026-8801',
      serviceSlug: 'teletalk-govt-job',
      serviceTitleBn: 'সরকারি ও টেলিটক চাকরির আবেদন ও এডমিট কার্ড',
      serviceTitleEn: 'Government & Teletalk Job Applications',
      customerName: 'Md. Fahim Hossain',
      customerPhone: '01723456789',
      customerEmail: 'fahim.bd@gmail.com',
      officialGovtFeeBdt: 223,
      shopServiceChargeBdt: 100,
      status: 'READY_FOR_APPROVAL',
      paymentStatus: 'VERIFIED',
      assignedStaffName: 'Shakil (Digital Desk)',
      formData: {
        applicantNameBn: 'মো: ফাহিম হোসেন',
        applicantNameEn: 'MD. FAHIM HOSSAIN',
        fatherNameEn: 'MD. ABDUL MOTIN',
        motherNameEn: 'ROKEYA BEGUM',
        dob: '1998-05-14',
        nidNumber: '19982692012345678',
        presentAddress: 'House 14, Road 5, Block B, Mirpur 12, Dhaka',
        permanentAddress: 'Village: Haripur, Post: Haripur, Thana: Haripur, District: Thakurgaon',
        educationDetails: 'SSC: 2014, GPA: 5.00, Board: Dinajpur; HSC: 2016, GPA: 4.83, Board: Dinajpur; B.Sc in CSE: 2021, CGPA: 3.65',
        postName: 'Assistant Programmer / Computer Operator'
      },
      deliverables: [
        {
          id: 'del-app-1',
          title: 'Official Teletalk Application Copy (Pre-Submission Draft)',
          fileUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=800',
          deliverableType: 'APPLICATION_COPY',
          uploadedAt: new Date(Date.now() - 1800000).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'app-8802',
      referenceNumber: 'APP-2026-8802',
      serviceSlug: 'e-passport-application',
      serviceTitleBn: 'ই-পাসপোর্ট নতুন আবেদন ও নবায়ন (E-Passport)',
      serviceTitleEn: 'E-Passport Application & Renewal Assistance',
      customerName: 'Nusrat Jahan',
      customerPhone: '01899887766',
      customerEmail: 'nusrat.jahan@yahoo.com',
      officialGovtFeeBdt: 5750,
      shopServiceChargeBdt: 300,
      status: 'IN_PROGRESS',
      paymentStatus: 'VERIFIED',
      assignedStaffName: 'Naimur (Manager)',
      formData: {
        applicantNameEn: 'NUSRAT JAHAN',
        fatherNameEn: 'MOHAMMED JAHANGIR ALAM',
        motherNameEn: 'NASIMA AKTER',
        dob: '2001-11-20',
        nidNumber: '5512349876',
        passportType: '48 Pages / 10 Years (Regular)',
        presentAddress: 'Flat 4B, Green Road, Dhanmondi, Dhaka-1205',
        permanentAddress: 'Same as present address',
        emergencyContact: 'Father: 01711000000'
      },
      deliverables: [],
      createdAt: new Date(Date.now() - 43200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'app-8803',
      referenceNumber: 'APP-2026-8803',
      serviceSlug: 'birth-registration-correction',
      serviceTitleBn: 'অনলাইন জন্ম নিবন্ধন আবেদন ও তথ্য সংশোধন',
      serviceTitleEn: 'Digital Birth Registration & Correction Assistance',
      customerName: 'Shakil Ahmed',
      customerPhone: '01611223344',
      officialGovtFeeBdt: 50,
      shopServiceChargeBdt: 120,
      status: 'SUBMITTED_FOR_REVIEW',
      paymentStatus: 'UNPAID',
      assignedStaffName: 'Front Counter',
      formData: {
        applicantNameBn: 'শাকিল আহমেদ',
        applicantNameEn: 'SHAKIL AHMED',
        dob: '1999-03-25',
        gender: 'পুরুষ (Male)',
        correctionReason: 'ইংরেজি নামের বানানে অক্ষরের ভুল সংশোধন'
      },
      deliverables: [],
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      updatedAt: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: 'app-8804',
      referenceNumber: 'APP-2026-8804',
      serviceSlug: 'nid-correction-reissue',
      serviceTitleBn: 'জাতীয় পরিচয়পত্র (NID) সংশোধন ও রি-ইস্যু আবেদন',
      serviceTitleEn: 'National ID (NID) Correction & Lost Reissue',
      customerName: 'Abdur Rashid',
      customerPhone: '01555667788',
      officialGovtFeeBdt: 230,
      shopServiceChargeBdt: 150,
      status: 'COMPLETED',
      paymentStatus: 'VERIFIED',
      assignedStaffName: 'Naimur (Manager)',
      formData: {
        nidNumber: '19752691234567890',
        dob: '1975-01-01',
        correctionType: 'হারানো NID রি-ইস্যু (Reissue)',
        gdNumber: 'GD-4421, Ramna Thana'
      },
      deliverables: [
        {
          id: 'del-app-4',
          title: 'Election Commission Payment Challan & Reissue Slip',
          fileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=800',
          deliverableType: 'CONFIRMATION_SLIP',
          uploadedAt: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ];

  const initialPrintQueue: PrintQueueItem[] = [
    {
      id: 'prn-8801',
      tokenNumber: '8801',
      customerName: 'Md. Imran',
      customerPhone: '01711223344',
      fileName: 'CSE_Final_Year_Thesis_Report_V3.pdf',
      paperSize: 'A4',
      colorMode: 'FULL_COLOR',
      copies: 3,
      pageRange: 'All Pages (85 pages)',
      bindingOrLamination: 'SPIRAL_BINDING',
      notes: 'Please print cover page on glossy photo paper and bind carefully.',
      estimatedPriceBdt: 420,
      status: 'READY_FOR_PICKUP',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'prn-8802',
      tokenNumber: '8802',
      customerName: 'Farzana Akhter',
      customerPhone: '01833445566',
      fileName: 'Passport_Biometric_Photo_4R_Sheet.jpg',
      paperSize: 'PHOTO_4R',
      colorMode: 'FULL_COLOR',
      copies: 2,
      pageRange: '1 Page',
      bindingOrLamination: 'NONE',
      notes: 'Urgent passport 4 copies print on Kodak satin paper.',
      estimatedPriceBdt: 60,
      status: 'PRINTING',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 1200000).toISOString(),
    },
    {
      id: 'prn-8803',
      tokenNumber: '8803',
      customerName: 'Haji Mokbul Hossain',
      customerPhone: '01922334455',
      fileName: 'Khatian_Land_Document_Deed.pdf',
      paperSize: 'LEGAL',
      colorMode: 'BLACK_WHITE',
      copies: 5,
      pageRange: 'Pages 1-4',
      bindingOrLamination: 'LAMINATION',
      notes: 'Double sided photocopy with thick 100 micron lamination.',
      estimatedPriceBdt: 140,
      status: 'QUEUED',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    }
  ];

  const initialSales = [
    {
      id: 'sale-001',
      orderNumber: 'INV-2026-1042',
      customerName: 'Karim Rahman',
      customerPhone: '01812345678',
      total: 1250,
      subtotal: 1250,
      discount: 0,
      paidAmount: 1250,
      paymentMethod: 'CASH',
      status: 'COMPLETED',
      items: [
        { name: 'Wireless Mouse', quantity: 1, unitPrice: 450, total: 450 },
        { name: 'USB Keyboard', quantity: 1, unitPrice: 650, total: 650 },
        { name: 'A4 Color Print', quantity: 10, unitPrice: 15, total: 150 },
      ],
      createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'sale-002',
      orderNumber: 'INV-2026-1043',
      customerName: 'Jamal Bhuiyan',
      customerPhone: '0171635679',
      total: 650,
      subtotal: 650,
      discount: 0,
      paidAmount: 650,
      paymentMethod: 'BKASH',
      status: 'COMPLETED',
      items: [
        { name: '64GB Pendrive', quantity: 1, unitPrice: 650, total: 650 }
      ],
      createdAt: new Date(Date.now() - 14400000).toISOString()
    },
    {
      id: 'sale-003',
      orderNumber: 'INV-2026-1044',
      customerName: 'Local High School',
      customerPhone: '0171974862',
      total: 3500,
      subtotal: 3500,
      discount: 0,
      paidAmount: 2000,
      dueAmount: 1500,
      paymentMethod: 'MIXED',
      status: 'PARTIAL',
      items: [
        { name: 'A4 Paper Ream 80gsm', quantity: 5, unitPrice: 520, total: 2600 },
        { name: 'Gel Pen Box (10pcs)', quantity: 3, unitPrice: 300, total: 900 }
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  const initialExpenses = [
    {
      id: 'exp-1',
      expenseId: 'EXP-2026-001',
      amount: 4500,
      category: 'SUPPLIES',
      paymentMethod: 'CASH',
      description: 'Purchased 10 Boxes of Double A A4 80gsm Reams from Nilkhet wholesale paper market',
      receiptRef: 'MEMO-9981',
      branchName: 'Main Storefront',
      expenseDate: todayStr,
      createdByName: 'Naimur (Admin)',
      createdAt: new Date(Date.now() - 18000000).toISOString()
    },
    {
      id: 'exp-2',
      expenseId: 'EXP-2026-002',
      amount: 1200,
      category: 'UTILITIES',
      paymentMethod: 'BKASH',
      description: 'High-speed Fiber Internet Monthly Bill (50 Mbps dedicated link)',
      receiptRef: 'NET-OCT-2026',
      branchName: 'Main Storefront',
      expenseDate: todayStr,
      createdByName: 'Staff',
      createdAt: new Date(Date.now() - 36000000).toISOString()
    }
  ];

  globalThis.__businessOS_demo_store = {
    serviceJobs: initialJobs,
    serviceApplications: initialApplications,
    printQueue: initialPrintQueue,
    heldCarts: [],
    salesHistory: initialSales,
    expenses: initialExpenses,
    cashRegister: {
      openingBalance: 5000,
      isClosed: false,
    },
    digitalServices: {
      balances: {
        BKASH_AGENT: 42500,
        NAGAD_AGENT: 28900,
        ROCKET_AGENT: 15200,
        FLEXILOAD_SIM: 6450,
        POLY_BIDYUT_UTILITY: 8200,
        PHYSICAL_CASH_DRAWER: 14500,
      },
      transactions: [
        {
          id: 'ds-tx-1',
          trxId: 'TRX-BK-98214',
          transactionType: 'MFS_CASH_IN',
          wallet: 'BKASH_AGENT',
          recipientPhoneOrAccount: '01712-345678',
          customerName: 'Monir Hossain',
          amountBdt: 2000,
          serviceChargeOrFeeBdt: 0,
          commissionEarnedBdt: 8,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'ds-tx-2',
          trxId: 'TRX-NG-55120',
          transactionType: 'MFS_CASH_OUT',
          wallet: 'NAGAD_AGENT',
          recipientPhoneOrAccount: '01890-123456',
          customerName: 'Shahinur Islam',
          amountBdt: 5000,
          serviceChargeOrFeeBdt: 0,
          commissionEarnedBdt: 22.5,
          createdAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 'ds-tx-3',
          trxId: 'TRX-FX-10492',
          transactionType: 'MOBILE_RECHARGE',
          wallet: 'FLEXILOAD_SIM',
          recipientPhoneOrAccount: '01711-889900',
          customerName: 'Farhana Yeasmin',
          amountBdt: 199,
          serviceChargeOrFeeBdt: 0,
          commissionEarnedBdt: 5,
          createdAt: new Date(Date.now() - 10800000).toISOString()
        },
        {
          id: 'ds-tx-4',
          trxId: 'TRX-PB-77401',
          transactionType: 'ELECTRICITY_UTILITY_BILL',
          wallet: 'POLY_BIDYUT_UTILITY',
          recipientPhoneOrAccount: 'SMS A/C: 1048829104',
          customerName: 'Abdur Razzak',
          amountBdt: 1450,
          serviceChargeOrFeeBdt: 20,
          commissionEarnedBdt: 5,
          createdAt: new Date(Date.now() - 14400000).toISOString()
        }
      ]
    },
    documentStudio: {
      templates: [
        {
          id: 'minimal-clean',
          titleBn: 'মিনিমাল ক্লিন সিভি ও রিজিউম',
          titleEn: 'Minimal Clean Professional Resume',
          category: 'CV_RESUME',
          description: 'Single column ATS-friendly clean layout suitable for modern corporate and entry jobs.',
          priceBdt: 150
        },
        {
          id: 'modern-tech',
          titleBn: 'মডার্ন আইটি ও টেক বায়োডাটা',
          titleEn: 'Modern Tech Curriculum Vitae',
          category: 'CV_RESUME',
          description: 'Dual column design with prominent skills radar, GitHub/Portfolio links, and project achievements.',
          priceBdt: 200
        },
        {
          id: 'corporate-bd',
          titleBn: 'কর্পোরেট এক্সিকিউটিভ সিভি',
          titleEn: 'Corporate Executive Resume',
          category: 'CV_RESUME',
          description: 'Prestigious layout with photo placeholder, professional experience chronology, and referee blocks.',
          priceBdt: 250
        },
        {
          id: 'marriage-biodata',
          titleBn: 'বিবাহের বায়োডাটা ফরম্যাট',
          titleEn: 'Bangla Marriage Bio-data',
          category: 'LEGAL_CIVIC',
          description: 'Traditional standard Islamic and civic marriage curriculum format with family background section.',
          priceBdt: 120
        },
        {
          id: 'agreement-stamp',
          titleBn: '৩০০ টাকার নন-জুডিশিয়াল স্ট্যাম্প এগ্রিমেন্ট',
          titleEn: 'Non-Judicial 300 Tk Stamp Agreement',
          category: 'LEGAL_CIVIC',
          description: 'Exact margin-calibrated template for Bangladesh Government non-judicial stamp paper printing.',
          priceBdt: 300
        },
        {
          id: 'house-rent-deed',
          titleBn: 'বাড়ি ভাড়া চুক্তিপত্র দলিল',
          titleEn: 'House Rent Agreement Deed',
          category: 'LEGAL_CIVIC',
          description: 'Standard tenancy contract between landlord and tenant with advance and clause provisions.',
          priceBdt: 250
        }
      ],
      orders: [
        {
          id: 'doc-ord-1',
          orderNumber: 'DOC-2026-881',
          templateId: 'minimal-clean',
          templateName: 'মিনিমাল ক্লিন সিভি ও রিজিউম',
          category: 'CV_RESUME',
          customerName: 'Shakil Mahmud',
          customerPhone: '01819-223344',
          status: 'COMPLETED',
          priceBdt: 150,
          createdAt: new Date(Date.now() - 18000000).toISOString()
        },
        {
          id: 'doc-ord-2',
          orderNumber: 'DOC-2026-882',
          templateId: 'agreement-stamp',
          templateName: '৩০০ টাকার নন-জুডিশিয়াল স্ট্যাম্প এগ্রিমেন্ট',
          category: 'LEGAL_CIVIC',
          customerName: 'Rafiqul Islam & Brothers',
          customerPhone: '01712-998877',
          status: 'IN_PROGRESS',
          priceBdt: 300,
          createdAt: new Date(Date.now() - 36000000).toISOString()
        }
      ]
    },
    serviceScheduling: {
      settings: {
        openingTime: '09:30',
        closingTime: '20:30',
        breakStart: '13:30',
        breakEnd: '14:30',
        defaultSlotMinutes: 20,
        maxConcurrentPerSlot: 2,
        workingDays: [6, 0, 1, 2, 3, 4]
      },
      appointments: [
        {
          id: 'apt-1',
          tokenNumber: 'APT-101',
          customerName: 'Tariqul Islam',
          customerPhone: '01712-445566',
          serviceTitleBn: 'ল্যাপটপ ডিসপ্লে ও হিঞ্জ রিপ্লেসমেন্ট',
          date: todayStr,
          slotTime: '11:00 AM - 11:30 AM',
          status: 'CONFIRMED',
          notes: 'Customer bringing Dell Inspiron 15',
          createdAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 'apt-2',
          tokenNumber: 'APT-102',
          customerName: 'Kazi Mahbub',
          customerPhone: '01819-334455',
          serviceTitleBn: 'পাসপোর্ট ও পুলিশ ক্লিয়ারেন্স আবেদন কনসালটেন্সি',
          date: todayStr,
          slotTime: '03:00 PM - 03:30 PM',
          status: 'CHECKED_IN',
          notes: 'Documents verified at counter',
          createdAt: new Date(Date.now() - 14400000).toISOString()
        }
      ]
    },
    customerVault: [
      {
        id: 'VAULT-123456',
        customerId: 'cust-karim-004',
        organizationId: 'f3281531-1153-4a8f-92b1-5f2b5f2efb60',
        phone: '01812345678',
        email: 'karim@prismex.local',
        nameEn: 'MD KARIM RAHMAN',
        nameBn: 'মোঃ করিম রহমান',
        fatherNameEn: 'MD ABDUR RAHIM',
        fatherNameBn: 'মোঃ আব্দুর রহিম',
        motherNameEn: 'MST ROKEYA BEGUM',
        motherNameBn: 'মোসাঃ রোকেয়া বেগম',
        dob: '1998-04-15',
        gender: 'MALE',
        religion: 'ISLAM',
        maritalStatus: 'SINGLE',
        bloodGroup: 'B+',
        nidNumber: '19982692019000124',
        birthRegNumber: '19982692019123456',
        presentAddress: 'House 14, Road 5, Sector 7, Uttara, Dhaka-1230',
        permanentAddress: 'Village Baghiya, Post Kashimpur-1704, Gazipur Sadar, Gazipur',
        presentStructuredAddress: {
          villageArea: 'Sector 7, Road 5, House 14',
          postOffice: 'Uttara',
          postalCode: '1230',
          upazilaThana: 'Uttara',
          district: 'Dhaka',
          division: 'Dhaka',
          country: 'বাংলাদেশ'
        },
        permanentStructuredAddress: {
          villageArea: 'Baghiya',
          postOffice: 'Kashimpur',
          postalCode: '1704',
          upazilaThana: 'Gazipur Sadar',
          district: 'Gazipur',
          division: 'Dhaka',
          country: 'বাংলাদেশ'
        },
        educationHistory: [
          {
            degree: 'SSC',
            examTitle: 'Secondary School Certificate (SSC)',
            boardOrUniversity: 'Dhaka Board',
            institution: 'Uttara High School',
            rollNumber: '142850',
            regNumber: '1114892014',
            passingYear: '2014',
            resultGpa: '5.00',
            groupMajor: 'Science'
          },
          {
            degree: 'HSC',
            examTitle: 'Higher Secondary Certificate (HSC)',
            boardOrUniversity: 'Dhaka Board',
            institution: 'Milestone College',
            rollNumber: '502914',
            regNumber: '1114892014',
            passingYear: '2016',
            resultGpa: '4.83',
            groupMajor: 'Science'
          },
          {
            degree: 'GRADUATION',
            examTitle: 'Bachelor of Science in CSE',
            boardOrUniversity: 'Dhaka University',
            institution: 'Institute of Science and Technology',
            rollNumber: '160408',
            passingYear: '2021',
            resultGpa: '3.78',
            groupMajor: 'Computer Science & Engineering'
          }
        ],
        documents: [
          {
            id: 'doc-photo-001',
            docType: 'PHOTO',
            title: 'Passport Size Color Photo (300x300)',
            mimeType: 'image/jpeg',
            sizeBytes: 42100,
            uploadedAt: '2026-10-20T10:00:00Z',
            isVerified: true,
            fileUrlOrBase64: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300&q=80'
          },
          {
            id: 'doc-sig-001',
            docType: 'SIGNATURE',
            title: 'Customer Official Signature Crop (300x80)',
            mimeType: 'image/png',
            sizeBytes: 16500,
            uploadedAt: '2026-10-20T10:05:00Z',
            isVerified: true,
            fileUrlOrBase64: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="80"><text x="20" y="50" font-family="cursive" font-size="28" fill="black">Karim Rahman</text></svg>'
          },
          {
            id: 'doc-nid-001',
            docType: 'NID',
            title: 'National ID Card Smart Scan',
            mimeType: 'image/jpeg',
            sizeBytes: 89000,
            uploadedAt: '2026-10-20T10:10:00Z',
            isVerified: true,
            fileUrlOrBase64: '/sample-nid.jpg'
          }
        ],
        dynamicFields: [
          {
            id: 'df-1',
            key: 'passport_number',
            labelEn: 'Passport Number',
            labelBn: 'পাসপোর্ট নম্বর',
            category: 'PASSPORT',
            fieldType: 'TEXT',
            value: 'A04928172',
            status: 'VERIFIED',
            updatedAt: '2026-10-20T10:00:00Z'
          }
        ],
        createdAt: '2026-10-20T10:00:00Z',
        updatedAt: '2026-10-20T10:00:00Z'
      }
    ],
    extensionEvents: []
  };

  return globalThis.__businessOS_demo_store;
}

export const demoStore = {
  get store() {
    return initStore();
  },

  // --- SERVICE JOBS ---
  getServiceJobs(status?: string, search?: string) {
    let list = [...this.store.serviceJobs];
    if (status && status !== 'ALL') {
      const s = status.toUpperCase();
      if (s === 'RECEIVED' || s === 'PENDING') {
        list = list.filter(j => j.status === 'RECEIVED' || j.status === 'PENDING');
      } else if (s === 'DELIVERED' || s === 'DELIVERED_PAID') {
        list = list.filter(j => j.status === 'DELIVERED' || j.status === 'DELIVERED_PAID');
      } else {
        list = list.filter(j => (j.status as string) === s);
      }
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(j => 
        (j.jobNumber && j.jobNumber.toLowerCase().includes(q)) ||
        (j.customerName && j.customerName.toLowerCase().includes(q)) ||
        (j.customerPhone && j.customerPhone.includes(q)) ||
        (j.serviceCategory && j.serviceCategory.toLowerCase().includes(q)) ||
        (j.jobDescription && j.jobDescription.toLowerCase().includes(q))
      );
    }
    return list;
  },

  createServiceJob(data: any) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const jobNumber = `JOB-2026-${num}`;
    const newJob: ServiceJob = {
      id: genId('job'),
      jobNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      serviceCategory: data.serviceCategory || 'Computer & IT Service',
      jobDescription: data.jobDescription || 'Standard diagnostics and service',
      deviceOrFileDetails: data.deviceOrFileDetails,
      estimatedCostBdt: Number(data.estimatedCostBdt || 0),
      advancePaidBdt: Number(data.advancePaidBdt || 0),
      assignedStaffName: data.assignedStaffName || 'Assigned Staff',
      status: 'PENDING',
      promisedDeliveryDate: data.promisedDeliveryDate,
      deliverables: [],
      statusHistory: [
        { status: 'PENDING', updatedAt: new Date().toISOString(), note: 'Job created at terminal' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.store.serviceJobs.unshift(newJob);
    return newJob;
  },

  updateJobStatus(jobNumberOrId: string, status: any, notes?: string) {
    const job = this.store.serviceJobs.find(j => j.jobNumber === jobNumberOrId || j.id === jobNumberOrId);
    if (!job) return null;
    job.status = status;
    job.updatedAt = new Date().toISOString();
    if (!job.statusHistory) job.statusHistory = [];
    job.statusHistory.push({
      status,
      updatedAt: new Date().toISOString(),
      note: notes || `Status updated to ${status}`
    });
    return job;
  },

  addJobDeliverable(jobIdOrNum: string, deliverable: any) {
    const job = this.store.serviceJobs.find(j => j.id === jobIdOrNum || j.jobNumber === jobIdOrNum);
    if (!job) return null;
    if (!job.deliverables) job.deliverables = [];
    const item = {
      id: genId('del'),
      title: deliverable.title,
      fileUrl: deliverable.fileUrl || deliverable.url,
      deliverableType: deliverable.deliverableType || 'DELIVERY_CHALLAN',
      uploadedAt: new Date().toISOString()
    };
    job.deliverables.unshift(item);
    return item;
  },

  // --- SERVICE APPLICATIONS ---
  getServiceApplications(status?: string, search?: string) {
    let list = [...this.store.serviceApplications];
    if (status && status !== 'ALL') {
      list = list.filter(a => a.status === status);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(a => 
        a.referenceNumber.toLowerCase().includes(q) ||
        a.customerName.toLowerCase().includes(q) ||
        a.customerPhone.includes(q) ||
        a.serviceTitleBn.toLowerCase().includes(q) ||
        a.serviceTitleEn.toLowerCase().includes(q)
      );
    }
    return list;
  },

  getApplicationByRef(ref: string) {
    const cleanRef = ref.toLowerCase().trim();
    return this.store.serviceApplications.find(a => 
      a.referenceNumber.toLowerCase() === cleanRef || 
      a.id.toLowerCase() === cleanRef
    ) || null;
  },

  submitServiceApplication(data: any) {
    const refNum = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Find service definition if available
    const serviceDef = DEFAULT_INTERNET_SERVICES.find(s => s.slug === data.serviceSlug || s.id === data.serviceSlug);

    const newApp: ServiceApplication = {
      id: genId('app'),
      referenceNumber: refNum,
      serviceSlug: data.serviceSlug || 'custom-service',
      serviceTitleBn: data.serviceTitleBn || serviceDef?.titleBn || 'অনলাইন সেবা আবেদন',
      serviceTitleEn: data.serviceTitleEn || serviceDef?.titleEn || 'Online Service Application',
      customerName: data.customerName || 'Citizen Applicant',
      customerPhone: data.customerPhone || '',
      customerEmail: data.customerEmail,
      officialGovtFeeBdt: Number(data.officialGovtFeeBdt ?? serviceDef?.officialGovtFeeBdt ?? 0),
      shopServiceChargeBdt: Number(data.shopServiceChargeBdt ?? serviceDef?.shopServiceChargeBdt ?? 100),
      status: 'SUBMITTED_FOR_REVIEW',
      paymentStatus: 'UNPAID',
      assignedStaffName: 'Front Desk Assistant',
      formData: data.formData || data.fieldValues || {},
      documents: data.documents || [],
      deliverables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.store.serviceApplications.unshift(newApp);
    return newApp;
  },

  updateApplicationStatus(ref: string, status: any, notes?: string, assignedStaffName?: string) {
    const app = this.getApplicationByRef(ref);
    if (!app) return null;
    app.status = status;
    if (assignedStaffName) app.assignedStaffName = assignedStaffName;
    app.updatedAt = new Date().toISOString();
    return app;
  },

  verifyApplicationPayment(ref: string, paymentStatus: 'VERIFIED' | 'REJECTED') {
    const app = this.getApplicationByRef(ref);
    if (!app) return null;
    app.paymentStatus = paymentStatus;
    if (paymentStatus === 'VERIFIED' && app.status === 'SUBMITTED_FOR_REVIEW') {
      app.status = 'IN_PROGRESS';
    }
    app.updatedAt = new Date().toISOString();
    return app;
  },

  // --- PRINT QUEUE ---
  getPrintQueue(status?: string) {
    let list = [...this.store.printQueue];
    if (status && status !== 'ALL') {
      const s = status.toUpperCase();
      if (s === 'WAITING_IN_QUEUE' || s === 'QUEUED') {
        list = list.filter(p => p.status === 'QUEUED' || p.status === 'WAITING_IN_QUEUE');
      } else if (s === 'PRINTING_NOW' || s === 'PRINTING') {
        list = list.filter(p => p.status === 'PRINTING' || p.status === 'PRINTING_NOW');
      } else if (s === 'PRINTED_READY' || s === 'READY_FOR_PICKUP') {
        list = list.filter(p => p.status === 'READY_FOR_PICKUP' || p.status === 'PRINTED_READY');
      } else if (s === 'BILLED_COMPLETED' || s === 'BILLED_DELIVERED') {
        list = list.filter(p => p.status === 'BILLED_DELIVERED' || p.status === 'BILLED_COMPLETED');
      } else {
        list = list.filter(p => (p.status as string) === s);
      }
    }
    return list;
  },

  submitPrintDrop(data: any) {
    const token = String(Math.floor(1000 + Math.random() * 9000));
    const newItem: PrintQueueItem = {
      id: genId('prn'),
      tokenNumber: token,
      customerName: data.customerName || 'Walk-in Customer',
      customerPhone: data.customerPhone || '',
      fileName: data.fileName || 'Uploaded_File.pdf',
      fileUrlOrBase64: data.fileUrlOrBase64,
      paperSize: data.paperSize || 'A4',
      colorMode: data.colorMode || 'BLACK_WHITE',
      copies: Number(data.copies || 1),
      pageRange: data.pageRange || 'All Pages',
      bindingOrLamination: data.bindingOrLamination || 'NONE',
      notes: data.notes || '',
      estimatedPriceBdt: Number(data.estimatedCost || 20),
      status: 'QUEUED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.store.printQueue.unshift(newItem);
    return newItem;
  },

  updatePrintStatus(id: string, status: any, finalCostBdt?: number) {
    const item = this.store.printQueue.find(p => p.id === id || p.tokenNumber === id);
    if (!item) return null;
    item.status = status;
    if (finalCostBdt !== undefined) item.finalCostBdt = Number(finalCostBdt);
    item.updatedAt = new Date().toISOString();
    return item;
  },

  // --- SALES & POS ---
  completeSale(saleData: any) {
    const orderNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const sale = {
      id: genId('sale'),
      orderNumber,
      customerName: saleData.customerName || 'Walking Customer',
      customerPhone: saleData.customerPhone || '',
      total: Number(saleData.total || 0),
      subtotal: Number(saleData.subtotal || saleData.total || 0),
      discount: Number(saleData.discount || 0),
      paidAmount: Number(saleData.paidAmount || saleData.total || 0),
      dueAmount: Number(saleData.dueAmount || 0),
      paymentMethod: saleData.paymentMethod || 'CASH',
      status: 'COMPLETED',
      items: saleData.items || [],
      createdAt: new Date().toISOString()
    };
    this.store.salesHistory.unshift(sale);

    // If sale was cash, increment cash register
    if (sale.paymentMethod === 'CASH') {
      this.store.cashRegister.openingBalance += sale.paidAmount;
    }

    return sale;
  },

  holdCart(cartData: any) {
    const held = {
      id: genId('held'),
      cartName: cartData.cartName || `Cart #${this.store.heldCarts.length + 1}`,
      items: cartData.items || [],
      total: cartData.total || 0,
      customerName: cartData.customerName || '',
      heldAt: new Date().toISOString()
    };
    this.store.heldCarts.unshift(held);
    return held;
  },

  getHeldCarts() {
    return [...this.store.heldCarts];
  },

  deleteHeldCart(id: string) {
    this.store.heldCarts = this.store.heldCarts.filter(c => c.id !== id);
    return { success: true };
  },

  getSalesHistory() {
    return this.store.salesHistory;
  },

  getExpenses() {
    return this.store.expenses;
  },

  getCashRegisterSummary() {
    return {
      openingBalance: this.store.cashRegister.openingBalance,
      isClosed: this.store.cashRegister.isClosed,
      cashInDrawer: this.store.cashRegister.openingBalance,
      expectedClosingBalance: this.store.cashRegister.openingBalance
    };
  },

  getBakiLedger() {
    return {
      totalDueBdt: 1500,
      totalCustomers: 2,
      customers: [
        { id: 'baki-1', customerName: 'Md. Al-Amin', phone: '01711223344', dueAmount: 1500, lastDate: '2026-10-21' }
      ]
    };
  },

  // --- TRACKING ---
  track(query: string) {
    const cleanQ = query.toLowerCase().trim();
    const cleanPhone = query.replace(/[^0-9]/g, '');

    // 1. Check Internet Application
    const app = this.store.serviceApplications.find(a => 
      a.referenceNumber.toLowerCase() === cleanQ ||
      (cleanPhone.length >= 7 && a.customerPhone.replace(/[^0-9]/g, '').includes(cleanPhone)) ||
      a.customerName.toLowerCase().includes(cleanQ)
    );
    if (app) {
      return {
        found: true,
        type: 'INTERNET_SERVICE_APP',
        referenceNumber: app.referenceNumber,
        title: `${app.serviceTitleBn} — ${app.serviceTitleEn}`,
        customerName: app.customerName,
        customerPhone: app.customerPhone,
        status: app.status,
        statusText: app.status,
        estimatedDelivery: 'আজকের মধ্যে অথবা ১-২ কার্যদিবসে প্রস্তুত',
        totalPayableBdt: app.officialGovtFeeBdt + app.shopServiceChargeBdt,
        paymentStatus: app.paymentStatus,
        deliverables: app.deliverables || [],
        createdAt: app.createdAt
      };
    }

    // 2. Check Physical Service Job
    const job = this.store.serviceJobs.find(j => 
      j.jobNumber.toLowerCase() === cleanQ ||
      (cleanPhone.length >= 7 && j.customerPhone.replace(/[^0-9]/g, '').includes(cleanPhone)) ||
      j.customerName.toLowerCase().includes(cleanQ)
    );
    if (job) {
      return {
        found: true,
        type: 'PHYSICAL_SERVICE_JOB',
        referenceNumber: job.jobNumber,
        title: job.serviceCategory,
        customerName: job.customerName,
        customerPhone: job.customerPhone,
        status: job.status,
        deviceOrDetails: job.deviceOrFileDetails,
        estimatedCostBdt: job.estimatedCostBdt,
        advancePaidBdt: job.advancePaidBdt,
        dueAmountBdt: Math.max(0, job.estimatedCostBdt - job.advancePaidBdt),
        promisedDeliveryDate: job.promisedDeliveryDate,
        deliverables: job.deliverables || [],
        createdAt: job.createdAt
      };
    }

    // 3. Check Print Drop Queue
    const prn = this.store.printQueue.find(p => 
      p.tokenNumber === cleanQ ||
      `prn-${p.tokenNumber}` === cleanQ ||
      (cleanPhone.length >= 7 && p.customerPhone.replace(/[^0-9]/g, '').includes(cleanPhone))
    );
    if (prn) {
      return {
        found: true,
        type: 'PRINT_DROP_QUEUE',
        referenceNumber: `#${prn.tokenNumber}`,
        title: `প্রিন্ট কিউ: ${prn.fileName}`,
        customerName: prn.customerName,
        customerPhone: prn.customerPhone,
        status: prn.status,
        copies: prn.copies,
        paperSize: prn.paperSize,
        estimatedPriceBdt: prn.estimatedPriceBdt,
        createdAt: prn.createdAt
      };
    }

    return { found: false, message: 'প্রদত্ত নম্বর বা রেফারেন্স দিয়ে কোনো অর্ডার অথবা জব খুঁজে পাওয়া যায়নি।' };
  },

  addApplicationDeliverable(appIdOrRef: string, deliverable: any) {
    const app = this.getApplicationByRef(appIdOrRef);
    if (!app) return null;
    if (!app.deliverables) app.deliverables = [];
    const item = {
      id: genId('del'),
      title: deliverable.title || 'Official Delivered Document',
      fileUrl: deliverable.fileUrl || deliverable.url || '/sample-deliverable.pdf',
      deliverableType: deliverable.deliverableType || 'FINAL_DOWNLOAD_APPLICATION',
      uploadedAt: new Date().toISOString()
    };
    app.deliverables.unshift(item);
    return item;
  },

  // --- DIGITAL SERVICES & MFS ---
  getDigitalSummary() {
    const ds = this.store.digitalServices;
    const balances = ds.balances;
    const transactions = ds.transactions;
    const totalDigitalFloatBdt = (balances.BKASH_AGENT || 0) + (balances.NAGAD_AGENT || 0) + (balances.ROCKET_AGENT || 0) + (balances.FLEXILOAD_SIM || 0) + (balances.POLY_BIDYUT_UTILITY || 0);
    const cashDrawerBdt = balances.PHYSICAL_CASH_DRAWER || 0;
    
    const todayVolumeBdt = transactions.reduce((acc, t) => acc + (t.amountBdt || 0), 0);
    const todayCommissionsAndFeesBdt = transactions.reduce((acc, t) => acc + (t.commissionEarnedBdt || 0) + (t.serviceChargeOrFeeBdt || 0), 0);

    return {
      metrics: {
        totalDigitalFloatBdt,
        cashDrawerBdt,
        todayCount: transactions.length,
        todayVolumeBdt,
        todayCommissionsAndFeesBdt
      },
      balances,
      recentTransactions: transactions
    };
  },

  recordDigitalTransaction(data: any) {
    const ds = this.store.digitalServices;
    const txId = data.trxId || `TRX-${Date.now().toString().slice(-6)}`;
    const tx = {
      id: genId('tx'),
      trxId: txId,
      transactionType: data.transactionType,
      wallet: data.wallet,
      recipientPhoneOrAccount: data.recipientPhoneOrAccount,
      customerName: data.customerName || 'Walk-in Customer',
      amountBdt: Number(data.amountBdt || 0),
      serviceChargeOrFeeBdt: Number(data.serviceChargeOrFeeBdt || 0),
      commissionEarnedBdt: Number(data.commissionEarnedBdt || 0),
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    if (data.wallet && ds.balances[data.wallet] !== undefined) {
      if (data.transactionType === 'MFS_CASH_IN') {
        ds.balances[data.wallet] -= tx.amountBdt;
        ds.balances.PHYSICAL_CASH_DRAWER = (ds.balances.PHYSICAL_CASH_DRAWER || 0) + tx.amountBdt;
      } else if (data.transactionType === 'MFS_CASH_OUT') {
        ds.balances[data.wallet] += tx.amountBdt;
        ds.balances.PHYSICAL_CASH_DRAWER = Math.max(0, (ds.balances.PHYSICAL_CASH_DRAWER || 0) - tx.amountBdt);
      } else if (data.transactionType === 'MOBILE_RECHARGE' || data.transactionType === 'ELECTRICITY_UTILITY_BILL') {
        ds.balances[data.wallet] = Math.max(0, (ds.balances[data.wallet] || 0) - tx.amountBdt);
        ds.balances.PHYSICAL_CASH_DRAWER = (ds.balances.PHYSICAL_CASH_DRAWER || 0) + tx.amountBdt + tx.serviceChargeOrFeeBdt;
      }
    }

    ds.transactions.unshift(tx);
    return tx;
  },

  adjustDigitalFloat(wallet: string, type: 'DEPOSIT_ADD' | 'WITHDRAW_DEDUCT', amount: number, reason?: string) {
    const ds = this.store.digitalServices;
    if (ds.balances[wallet] === undefined) {
      ds.balances[wallet] = 0;
    }
    if (type === 'DEPOSIT_ADD') {
      ds.balances[wallet] += amount;
    } else {
      ds.balances[wallet] = Math.max(0, ds.balances[wallet] - amount);
    }
    return { success: true, balance: ds.balances[wallet], reason };
  },

  // --- DOCUMENT STUDIO ---
  getDocumentTemplates() {
    return this.store.documentStudio.templates;
  },

  getDocumentOrders(category?: string, status?: string, search?: string) {
    let list = [...this.store.documentStudio.orders];
    if (category && category !== 'ALL') {
      list = list.filter(o => o.category === category);
    }
    if (status && status !== 'ALL') {
      list = list.filter(o => o.status === status);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(o => 
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
      );
    }
    return {
      orders: list,
      metrics: {
        totalOrders: list.length,
        totalRevenueBdt: list.reduce((acc, o) => acc + (o.priceBdt || 0), 0)
      }
    };
  },

  createDocumentOrder(data: any) {
    const newOrder = {
      id: `doc-ord-${Date.now()}`,
      orderNumber: `DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
      templateId: data.templateId || 'minimal-clean',
      templateName: data.templateName || data.templateId || 'কাস্টম ডকুমেন্ট অর্ডার',
      category: data.category || 'CV_RESUME',
      customerName: data.customerName || 'Walk-in Customer',
      customerPhone: data.customerPhone || '',
      status: 'IN_PROGRESS',
      priceBdt: Number(data.priceBdt || data.price || 200),
      createdAt: new Date().toISOString()
    };
    this.store.documentStudio.orders.unshift(newOrder);
    return newOrder;
  },


  // --- SERVICE SCHEDULING ---
  getSchedulingSettings() {
    return this.store.serviceScheduling.settings;
  },

  saveSchedulingSettings(settings: any) {
    this.store.serviceScheduling.settings = {
      ...this.store.serviceScheduling.settings,
      ...settings
    };
    return this.store.serviceScheduling.settings;
  },

  getAppointments(date?: string, status?: string) {
    let list = [...this.store.serviceScheduling.appointments];
    if (date) {
      list = list.filter(a => a.date === date);
    }
    if (status && status !== 'ALL') {
      list = list.filter(a => a.status === status);
    }
    return list;
  },

  updateAppointmentStatus(tokenNumber: string, status: any) {
    const apt = this.store.serviceScheduling.appointments.find(a => a.tokenNumber === tokenNumber);
    if (!apt) return null;
    apt.status = status;
    apt.updatedAt = new Date().toISOString();
    return apt;
  },

  // --- COMPREHENSIVE BUSINESS ANALYTICS ---
  getAnalyticsDashboard(days: number = 30) {
    const now = new Date();
    const baseDailyIncome = 12400;
    const baseDailyCost = 8400;

    const chartData = [];
    for (let i = days; i >= 1; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const variance = Math.sin(i * 0.7) * 2600 + Math.cos(i * 0.4) * 1800;
      const income = Math.round(baseDailyIncome + variance);
      const cost = Math.round(baseDailyCost + variance * 0.65);
      chartData.push({
        date: dateStr,
        income,
        cost,
        profit: income - cost,
        type: 'actual'
      });
    }

    // 7 days forward prediction
    for (let j = 1; j <= 7; j++) {
      const d = new Date(now.getTime() + j * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const forecastVariance = Math.sin((j + 10) * 0.5) * 2200;
      const forecastIncome = Math.round(baseDailyIncome + 1200 + forecastVariance);
      chartData.push({
        date: dateStr,
        forecastIncome,
        type: 'forecast'
      });
    }

    const totalIncome = chartData
      .filter(c => c.type === 'actual')
      .reduce((acc, c) => acc + (c.income || 0), 0);
    const totalCost = chartData
      .filter(c => c.type === 'actual')
      .reduce((acc, c) => acc + (c.cost || 0), 0);
    const grossProfit = totalIncome - totalCost;
    const profitMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;

    const alerts = [
      {
        title: "বিক্রি প্রবৃদ্ধি ও পিক টাইম বিশ্লেষণ",
        message: "বিকাল ৩:০০ টা থেকে সন্ধ্যা ৭:০০ টা পর্যন্ত ফটোস্ট্যাট, অনলাইন আবেদন ও কম্পিউটার অ্যাক্সেসরিজে ৭০% লেনদেন সম্পন্ন হচ্ছে।",
        action: "পিক সময়ে কাউন্টারে সার্বক্ষণিক ২ জন স্টাফ নিয়োজিত রাখুন এবং ক্যাশ ড্রয়ার ব্যালেন্স বজায় রাখুন।",
        type: "info"
      },
      {
        title: "কম্পিউটার হার্ডওয়্যার মার্জিন হাইপার-গ্রোথ",
        message: "SSD, RAM ও ওয়াইফাই রাউটার ক্যাটাগরিতে গড় গ্রস প্রফিট মার্জিন ৩২.৪%-এ উন্নীত হয়েছে।",
        action: "চলতি সপ্তাহে ক্যাবল ও স্টোরেজ ডিভাইসের হোলসেল স্টক আরও ২০% বৃদ্ধি করার সুপারিশ।",
        type: "warning"
      },
      {
        title: "ডিজিটাল বাকি খাতা বকেয়া সতর্কতা",
        message: "লোকাল গ্রাহক ও স্কুল-কলেজের মোট বাকি বকেয়া ৳১৮,৫০০ অতিক্রম করেছে।",
        action: "স্বয়ংক্রিয় বাংলা এসএমএস রিমাইন্ডার পাঠিয়ে বকেয়া দ্রুত আদায়ের উদ্যোগ নিন।",
        type: "critical"
      }
    ];

    const categoryBreakdown = [
      { category: "Computer & Mobile Accessories", revenue: Math.round(totalIncome * 0.38), margin: 34.2, orders: Math.round(days * 4.2) },
      { category: "Storage & PC Hardware", revenue: Math.round(totalIncome * 0.28), margin: 28.5, orders: Math.round(days * 2.1) },
      { category: "Photocopy & High-Speed Printing", revenue: Math.round(totalIncome * 0.16), margin: 48.0, orders: Math.round(days * 8.5) },
      { category: "Govt & University Online Applications", revenue: Math.round(totalIncome * 0.11), margin: 62.0, orders: Math.round(days * 3.4) },
      { category: "MFS Commission & Utility Bills", revenue: Math.round(totalIncome * 0.07), margin: 95.0, orders: Math.round(days * 6.8) },
    ];

    const paymentMethodStats = [
      { method: "Physical Cash Till", amount: Math.round(totalIncome * 0.58), percentage: 58 },
      { method: "bKash Agent & Personal", amount: Math.round(totalIncome * 0.24), percentage: 24 },
      { method: "Nagad MFS Counter", amount: Math.round(totalIncome * 0.12), percentage: 12 },
      { method: "Baki / Due Account", amount: Math.round(totalIncome * 0.06), percentage: 6 },
    ];

    const topSellingProducts = [
      { name: "USB Optical Mouse (Plug & Play)", quantitySold: Math.round(days * 1.8), revenueBdt: Math.round(days * 1.8 * 450), profitBdt: Math.round(days * 1.8 * 170) },
      { name: "64GB USB 3.0 Pendrive", quantitySold: Math.round(days * 1.2), revenueBdt: Math.round(days * 1.2 * 650), profitBdt: Math.round(days * 1.2 * 190) },
      { name: "A4 Photo Quality Color Print", quantitySold: Math.round(days * 14), revenueBdt: Math.round(days * 14 * 15), profitBdt: Math.round(days * 14 * 9.5) },
      { name: "SSD 512GB NVMe High Speed", quantitySold: Math.round(days * 0.6), revenueBdt: Math.round(days * 0.6 * 3800), profitBdt: Math.round(days * 0.6 * 750) },
      { name: "Job Application Typing & Print Out", quantitySold: Math.round(days * 2.2), revenueBdt: Math.round(days * 2.2 * 150), profitBdt: Math.round(days * 2.2 * 115) },
    ];

    return {
      timeframe: `${days}_DAYS`,
      metrics: {
        totalIncome,
        totalCost,
        grossProfit,
        profitMargin,
        totalOrders: Math.round(days * 6.5),
        avgOrderValueBdt: Math.round(totalIncome / (days * 6.5)),
        totalBakiDueBdt: 18500,
        netProfit: Math.round(grossProfit * 0.78)
      },
      chartData,
      alerts,
      categoryBreakdown,
      paymentMethodStats,
      topSellingProducts,
      inventoryRisk: [
        { sku: "RAM-DDR4-8G", name: "RAM 8GB DDR4 3200MHz", currentStock: 2, safetyThreshold: 5, status: "LOW_STOCK" },
        { sku: "CAT6-CABLE-ROLL", name: "Cat6 Ethernet Cable Box", currentStock: 1, safetyThreshold: 3, status: "LOW_STOCK" },
        { sku: "PENDRIVE-128G", name: "128GB High Speed Pendrive", currentStock: 3, safetyThreshold: 6, status: "LOW_STOCK" }
      ],
      methodology: {
        forecastMethod: "ARIMA-X + Trend Holt-Winters",
        horizon: "+7 Days Rolling Multi-Tier"
      }
    };
  },

  getCustomerVaultProfile(phoneOrId: string) {
    const raw = (phoneOrId || '').trim();
    const cleanDigits = raw.replace(/\D/g, '');
    const found = this.store.customerVault.find((v: any) => {
      const vDigits = (v.phone || '').replace(/\D/g, '');
      return (
        v.id === raw ||
        v.customerId === raw ||
        v.phone === raw ||
        (cleanDigits.length >= 10 && (vDigits.endsWith(cleanDigits.slice(-10)) || cleanDigits.endsWith(vDigits.slice(-10))))
      );
    });

    if (!found) return null;

    return {
      success: true,
      data: {
        vaultId: found.id,
        customerId: found.customerId,
        updatedAt: found.updatedAt || new Date().toISOString(),
        version: found.version || 1,
        profile: {
          nameEn: found.nameEn,
          nameBn: found.nameBn,
          fatherNameEn: found.fatherNameEn,
          fatherNameBn: found.fatherNameBn,
          motherNameEn: found.motherNameEn,
          motherNameBn: found.motherNameBn,
          dob: found.dob,
          gender: found.gender,
          religion: found.religion,
          maritalStatus: found.maritalStatus,
          bloodGroup: found.bloodGroup,
          phone: found.phone,
          email: found.email,
          nidNumber: found.nidNumber,
          birthRegNumber: found.birthRegNumber,
          passportNumber: found.passportNumber,
          presentAddress: found.presentAddress,
          permanentAddress: found.permanentAddress,
          presentStructuredAddress: found.presentStructuredAddress,
          permanentStructuredAddress: found.permanentStructuredAddress,
        },
        education: found.education || [],
        documents: (found.documents || []).map((d: any) => ({
          id: d.id,
          docType: d.docType,
          title: d.title,
          originalName: d.originalName,
          mimeType: d.mimeType,
          fileSizeBytes: d.fileSizeBytes,
          widthPx: d.widthPx,
          heightPx: d.heightPx,
          accessEndpoint: `/api/admin/customer-vault/${found.id}/documents/${d.id}/access`,
          verified: d.verified ?? true,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        }))
      }
    };
  },

  syncCustomerVault(dto: any) {
    const { customerId, expectedVersion, updates, staffConfirmed } = dto;
    const found = this.store.customerVault.find((v: any) => v.id === customerId || v.customerId === customerId);
    if (!found) {
      return { status: 404, body: { message: `Customer Vault record not found for: ${customerId}` } };
    }

    if (expectedVersion !== undefined && found.version && found.version !== expectedVersion) {
      return {
        status: 409,
        body: {
          message: 'Stale update conflict detected. Vault record has been updated since last read.',
          currentVersion: found.version,
          expectedVersion
        }
      };
    }

    const sensitiveKeys = new Set(['nidNumber', 'dob', 'birthRegNumber', 'passportNumber', 'passport_number', 'sscRoll', 'hscRoll']);
    for (const key of Object.keys(updates || {})) {
      if (sensitiveKeys.has(key) && found[key] && found[key] !== updates[key] && !staffConfirmed) {
        return {
          status: 409,
          body: {
            message: `Update to sensitive field '${key}' requires explicit staff verification.`,
            field: key,
            currentValue: found[key],
            proposedValue: updates[key],
            requiresStaffConfirmation: true
          }
        };
      }
    }

    Object.assign(found, updates);
    found.version = (found.version || 1) + 1;
    found.updatedAt = new Date().toISOString();

    return {
      status: 200,
      body: {
        success: true,
        message: 'Customer vault synchronized successfully',
        newVersion: found.version,
        updatedFields: Object.keys(updates || {})
      }
    };
  },

  getDocumentAccess(phoneOrId: string, docId: string) {
    const profileRes = this.getCustomerVaultProfile(phoneOrId);
    if (!profileRes || !profileRes.data) {
      return { status: 404, body: { message: 'Customer Vault record not found' } };
    }

    const raw = (phoneOrId || '').trim();
    const cleanDigits = raw.replace(/\D/g, '');
    const found = this.store.customerVault.find((v: any) => {
      const vDigits = (v.phone || '').replace(/\D/g, '');
      return (
        v.id === raw ||
        v.customerId === raw ||
        v.phone === raw ||
        (cleanDigits.length >= 10 && (vDigits.endsWith(cleanDigits.slice(-10)) || cleanDigits.endsWith(vDigits.slice(-10))))
      );
    });

    const doc = (found?.documents || []).find((d: any) => d.id === docId);
    if (!doc) {
      return { status: 404, body: { message: `Document with ID ${docId} not found for this customer` } };
    }

    return {
      status: 200,
      body: {
        success: true,
        document: {
          id: doc.id,
          docType: doc.docType,
          title: doc.title,
          originalName: doc.originalName,
          mimeType: doc.mimeType,
          fileSizeBytes: doc.fileSizeBytes,
          widthPx: doc.widthPx,
          heightPx: doc.heightPx,
          downloadUrl: doc.storageUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300&q=80`,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          compliance: {
            isStandardPhotoCompliant: doc.docType === 'PHOTO' ? (doc.widthPx === 300 && doc.heightPx === 300 && doc.fileSizeBytes <= 100 * 1024) : undefined,
            isStandardSignatureCompliant: doc.docType === 'SIGNATURE' ? (doc.widthPx === 300 && doc.heightPx === 80 && doc.fileSizeBytes <= 60 * 1024) : undefined
          }
        }
      }
    };
  },

  logExtensionEvent(dto: any) {
    const event = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...dto
    };
    if (!this.store.extensionEvents) {
      this.store.extensionEvents = [];
    }
    this.store.extensionEvents.push(event);
    return { success: true, eventId: event.id };
  }
};


