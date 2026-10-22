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
  status: 'PENDING' | 'IN_PROGRESS' | 'WAITING_FOR_PARTS' | 'READY_FOR_DELIVERY' | 'DELIVERED_PAID' | 'CANCELLED';
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
  status: 'QUEUED' | 'PRINTING' | 'READY_FOR_PICKUP' | 'DELIVERED';
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
    }
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
      list = list.filter(j => j.status === status);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(j => 
        j.jobNumber.toLowerCase().includes(q) ||
        j.customerName.toLowerCase().includes(q) ||
        j.customerPhone.includes(q) ||
        j.serviceCategory.toLowerCase().includes(q)
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
      list = list.filter(p => p.status === status);
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
  }
};
