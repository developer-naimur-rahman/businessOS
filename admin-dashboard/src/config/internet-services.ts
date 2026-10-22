export interface ServiceDocRequirement {
  nameBn: string;
  nameEn: string;
  type: 'ORIGINAL' | 'SCAN' | 'PHOTO';
  isOptional: boolean;
  acceptedFormats: string[];
  maxSizeBytes: number;
  notesBn?: string;
}

export interface OrderedFieldSchema {
  order: number;
  key: string;
  labelBn: string;
  labelEn: string;
  type: 'text' | 'date' | 'select' | 'textarea' | 'number';
  required: boolean;
  options?: string[];
  helpTextBn?: string;
}

export interface InternetServiceDef {
  id: string;
  slug: string;
  titleBn: string;
  titleEn: string;
  category:
    | 'GOVT_JOB'
    | 'PASSPORT'
    | 'CIVIL_REG'
    | 'NID'
    | 'VISA'
    | 'TAX_TIN'
    | 'BRTA'
    | 'PHOTO_DOC'
    | 'VIDEO_EDITING'
    | 'GRAPHIC_DESIGN'
    | 'DIGITAL_MARKETING'
    | 'CYBERSECURITY'
    | 'PRINT_PHOTOCOPY';
  descriptionBn: string;
  descriptionEn: string;
  targetAudience: string;
  requiredDocs: ServiceDocRequirement[];
  photoSpecs?: {
    widthPx: number;
    heightPx: number;
    maxKb: number;
    bgColor: string;
    notesBn: string;
  };
  signatureSpecs?: {
    widthPx: number;
    heightPx: number;
    maxKb: number;
    notesBn: string;
  };
  orderedFields: OrderedFieldSchema[];
  officialGovtFeeBdt: number;
  shopServiceChargeBdt: number;
  estimatedProcessingTime: string;
  deliveryModes: ('ONLINE_DOWNLOAD' | 'SHOP_PICKUP' | 'COURIER')[];
  whatToBringToShopBn: string[];
  commonMistakesBn: string[];
  preparationInstructionsBn: string[];
  checklistItemsBn: string[];
  officialSourceUrl: string;
  officialSourceTitle: string;
  lastVerifiedDate: string;
  verificationStatus: 'VERIFIED' | 'NEEDS_REVIEW' | 'UNVERIFIED';
  isActive: boolean;
}

export const DEFAULT_INTERNET_SERVICES: InternetServiceDef[] = [
  {
    id: 'srv-teletalk-jobs',
    slug: 'teletalk-govt-job',
    titleBn: 'সরকারি ও টেলিটক চাকরির আবেদন ও এডমিট কার্ড',
    titleEn: 'Government & Teletalk Job Applications',
    category: 'GOVT_JOB',
    descriptionBn: 'টেলিটক জব পোর্টাল (alljobs/dgfp/bpsc/railway ইত্যাদি) ও সরকারি মন্ত্রণালয়ের অনলাইন নির্ভুল আবেদন, ফি প্রদান ও এডমিট কার্ড ডাউনলোড।',
    descriptionEn: 'Accurate online application submission for all Teletalk and government recruitment portals.',
    targetAudience: 'চাকরিপ্রার্থী (সরকারি ও স্বায়ত্তশাসিত প্রতিষ্ঠান)',
    requiredDocs: [
      { nameBn: 'পাসপোর্ট সাইজ ছবি', nameEn: 'Passport Size Photo', type: 'PHOTO', isOptional: false, acceptedFormats: ['image/jpeg', 'image/png'], maxSizeBytes: 102400, notesBn: 'অবশ্যই ৩০০x৩০০ পিক্সেল এবং সর্বোচ্চ ১০০ KB' },
      { nameBn: 'ডিজিটাল স্বাক্ষর', nameEn: 'Scanned Signature', type: 'SCAN', isOptional: false, acceptedFormats: ['image/jpeg', 'image/png'], maxSizeBytes: 61440, notesBn: 'অবশ্যই ৩০০x৮০ পিক্সেল এবং সর্বোচ্চ ৬০ KB' },
      { nameBn: 'জাতীয় পরিচয়পত্র (NID) / জন্ম নিবন্ধন', nameEn: 'NID or Birth Certificate', type: 'SCAN', isOptional: false, acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'], maxSizeBytes: 2097152 },
      { nameBn: 'সকল শিক্ষাগত যোগ্যতার সনদ ও রোল/রেজিস্ট্রেশন', nameEn: 'Academic Certificates & Roll/Reg', type: 'SCAN', isOptional: false, acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'], maxSizeBytes: 5242880 },
      { nameBn: 'কোটা সনদ (যদি প্রযোজ্য হয়)', nameEn: 'Quota Certificate (if applicable)', type: 'SCAN', isOptional: true, acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'], maxSizeBytes: 2097152 }
    ],
    photoSpecs: {
      widthPx: 300,
      heightPx: 300,
      maxKb: 100,
      bgColor: 'সাদা বা হালকা ব্যাকগ্রাউন্ড',
      notesBn: 'উভয় কান দৃশ্যমান, সানগ্লাস বা টুপি ছাড়া সাম্প্রতিক রঙিন ছবি।'
    },
    signatureSpecs: {
      widthPx: 300,
      heightPx: 80,
      maxKb: 60,
      notesBn: 'সাদা কাগজে কালো কালির পরিষ্কার স্বাক্ষর।'
    },
    orderedFields: [
      { order: 1, key: 'applicantNameBn', labelBn: 'আবেদনকারীর নাম (বাংলা)', labelEn: 'Applicant Name (Bangla)', type: 'text', required: true },
      { order: 2, key: 'applicantNameEn', labelBn: 'আবেদনকারীর নাম (ইংরেজি বড় হাতের)', labelEn: 'Applicant Name (English CAPS)', type: 'text', required: true },
      { order: 3, key: 'fatherNameEn', labelBn: 'পিতার নাম (ইংরেজি)', labelEn: 'Father Name (English)', type: 'text', required: true },
      { order: 4, key: 'motherNameEn', labelBn: 'মাতার নাম (ইংরেজি)', labelEn: 'Mother Name (English)', type: 'text', required: true },
      { order: 5, key: 'dob', labelBn: 'জন্ম তারিখ', labelEn: 'Date of Birth', type: 'date', required: true },
      { order: 6, key: 'nidNumber', labelBn: 'জাতীয় পরিচয়পত্র নম্বর (NID)', labelEn: 'NID Number', type: 'text', required: true },
      { order: 7, key: 'presentAddress', labelBn: 'বর্তমান ঠিকানা', labelEn: 'Present Address', type: 'textarea', required: true },
      { order: 8, key: 'permanentAddress', labelBn: 'স্থায়ী ঠিকানা (নিজ জেলা)', labelEn: 'Permanent Address (Home District)', type: 'textarea', required: true },
      { order: 9, key: 'educationDetails', labelBn: 'এসএসসি ও এইচএসসি পরীক্ষার তথ্য (বোর্ড, জিপিএ, সাল)', labelEn: 'Education Records (Board, GPA, Year)', type: 'textarea', required: true },
      { order: 10, key: 'quotaOrSpecialInfo', labelBn: 'কোটা ও বিশেষ অভিজ্ঞতা (প্রযোজ্য ক্ষেত্রে)', labelEn: 'Quota & Experience (if any)', type: 'text', required: false }
    ],
    officialGovtFeeBdt: 223,
    shopServiceChargeBdt: 100,
    estimatedProcessingTime: '১৫ থেকে ৩০ মিনিট',
    deliveryModes: ['ONLINE_DOWNLOAD', 'SHOP_PICKUP'],
    whatToBringToShopBn: [
      'মূল শিক্ষাগত সনদের ফটোকপি বা মূল কপি',
      'NID কার্ডের ফটোকপি বা মূল কপি',
      'পাসপোর্ট সাইজ ছবি ও সাদা কাগজে নমুনা স্বাক্ষর'
    ],
    commonMistakesBn: [
      'সার্টিফিকেটের সাথে নামের বানানের গরমিল',
      'ভুল জন্ম তারিখ বা ভুল পাশের সাল এন্ট্রি',
      'ছবির সাইজ ৩০০x৩০০ এর বেশি হওয়া অথবা অস্পষ্ট স্বাক্ষর'
    ],
    preparationInstructionsBn: [
      'বিজ্ঞপ্তি ভালোভাবে পড়ে শিক্ষাগত যোগ্যতার জিপিএ ও পাশের সাল যাচাই করুন।',
      'আমাদের অনলাইন পোর্টালে আপনার ছবি ও স্বাক্ষর আগেই রিসাইজ করে আপলোড করে রাখতে পারেন।'
    ],
    checklistItemsBn: [
      'আবেদনকারীর NID ও জন্ম সনদ প্রস্তুত',
      'এসএসসি/এইচএসসি রোল, রেজিস্ট্রেশন ও জিপিএ প্রস্তুত',
      'রঙিন ছবি ও স্বাক্ষর প্রস্তুত',
      'টেলিটক ফি প্রদানের জন্য প্রস্তুত'
    ],
    officialSourceUrl: 'https://alljobs.teletalk.com.bd',
    officialSourceTitle: 'Teletalk Alljobs Official Recruitment Portal',
    lastVerifiedDate: '2026-10-15',
    verificationStatus: 'VERIFIED',
    isActive: true
  },
  {
    id: 'srv-e-passport',
    slug: 'e-passport-application',
    titleBn: 'ই-পাসপোর্ট নতুন আবেদন ও নবায়ন (E-Passport)',
    titleEn: 'E-Passport Application & Renewal Assistance',
    category: 'PASSPORT',
    descriptionBn: 'বাংলাদেশ ই-পাসপোর্ট পোর্টালে নির্ভুল ফরম পূরণ, ফি হিসাব, প্রয়োজনীয় কাগজপত্রের তালিকা ও অ্যাপয়েন্টমেন্ট শিডিউল গাইড।',
    descriptionEn: 'End-to-end e-passport application filling, challan calculation, and appointment preparation.',
    targetAudience: 'নতুন পাসপোর্ট প্রত্যাশী ও নবায়নকারী নাগরিকবৃন্দ',
    requiredDocs: [
      { nameBn: 'মূল জাতীয় পরিচয়পত্র (NID) / অনলাইন জন্ম সনদ (১৮ বছরের নিচে)', nameEn: 'Original NID or 17-digit Digital Birth Certificate', type: 'ORIGINAL', isOptional: false, acceptedFormats: ['image/jpeg', 'application/pdf'], maxSizeBytes: 5242880 },
      { nameBn: 'পিতা ও মাতার NID কার্ডের ফটোকপি', nameEn: 'Parents NID copies', type: 'SCAN', isOptional: false, acceptedFormats: ['image/jpeg', 'application/pdf'], maxSizeBytes: 3145728 },
      { nameBn: 'পুরাতন পাসপোর্ট (নবায়নের ক্ষেত্রে)', nameEn: 'Previous Passport (for renewal)', type: 'ORIGINAL', isOptional: true, acceptedFormats: ['application/pdf', 'image/jpeg'], maxSizeBytes: 5242880 },
      { nameBn: 'নাগরিকত্ব সনদ / ইউপি চেয়ারম্যান বা কাউন্সিলর সার্টিফিকেট', nameEn: 'Citizenship Certificate', type: 'SCAN', isOptional: false, acceptedFormats: ['application/pdf', 'image/jpeg'], maxSizeBytes: 2097152 },
      { nameBn: 'নিকাহনামা / ম্যারেজ সার্টিফিকেট (বিবাহিত হলে)', nameEn: 'Marriage Certificate (if married)', type: 'SCAN', isOptional: true, acceptedFormats: ['application/pdf', 'image/jpeg'], maxSizeBytes: 2097152 }
    ],
    photoSpecs: {
      widthPx: 531,
      heightPx: 650,
      maxKb: 300,
      bgColor: 'সম্পূর্ণ সাদা ব্যাকগ্রাউন্ড (White Background)',
      notesBn: 'ছবিটি পাসপোর্ট অফিসে লাইভ ফিঙ্গারপ্রিন্ট ও বায়োমেট্রিকের দিন সরাসরি তোলা হবে। তবে অনলাইন ড্রাফটের জন্য সাম্প্রতিক ছবি সহায়ক।'
    },
    orderedFields: [
      { order: 1, key: 'applicantNameEn', labelBn: 'নাম (NID অনুযায়ী হুবহু ইংরেজি)', labelEn: 'Full Name (English matching NID)', type: 'text', required: true },
      { order: 2, key: 'fatherNameEn', labelBn: 'পিতার নাম (ইংরেজি)', labelEn: 'Father Name (English)', type: 'text', required: true },
      { order: 3, key: 'motherNameEn', labelBn: 'মাতার নাম (ইংরেজি)', labelEn: 'Mother Name (English)', type: 'text', required: true },
      { order: 4, key: 'dob', labelBn: 'জন্ম তারিখ', labelEn: 'Date of Birth', type: 'date', required: true },
      { order: 5, key: 'nidNumber', labelBn: 'NID নম্বর (অথবা ১৭ ডিজিটের অনলাইন জন্ম নিবন্ধন)', labelEn: 'NID or 17-Digit BRC', type: 'text', required: true },
      { order: 6, key: 'passportType', labelBn: 'পাসপোর্টের ধরণ (৪৮ পাতা ৫ বছর / ৪৮ পাতা ১০ বছর / ৬৪ পাতা)', labelEn: 'Passport Validity & Pages', type: 'select', required: true, options: ['48 Pages / 5 Years (Regular)', '48 Pages / 10 Years (Regular)', '48 Pages / 5 Years (Express)', '48 Pages / 10 Years (Express)'] },
      { order: 7, key: 'presentAddress', labelBn: 'বর্তমান ঠিকানা (থানা ও পোস্টকোড সহ)', labelEn: 'Present Address with PS & Postcode', type: 'textarea', required: true },
      { order: 8, key: 'permanentAddress', labelBn: 'স্থায়ী ঠিকানা (NID অনুযায়ী)', labelEn: 'Permanent Address', type: 'textarea', required: true },
      { order: 9, key: 'emergencyContact', labelBn: 'জরুরি যোগাযোগের তথ্য (নাম, সম্পর্ক, মোবাইল)', labelEn: 'Emergency Contact Info', type: 'textarea', required: true }
    ],
    officialGovtFeeBdt: 4025,
    shopServiceChargeBdt: 300,
    estimatedProcessingTime: '৩০ থেকে ৪৫ মিনিট',
    deliveryModes: ['ONLINE_DOWNLOAD', 'SHOP_PICKUP'],
    whatToBringToShopBn: [
      'মূল NID কার্ড অথবা ১৭ ডিজিটের ডিজিটাল জন্ম নিবন্ধন',
      'পিতা-মাতার NID ফটোকপি',
      'পুরাতন পাসপোর্ট (নবায়ন হলে মূল কপি)'
    ],
    commonMistakesBn: [
      'NID ও জন্ম নিবন্ধনের তথ্যের গরমিল',
      'স্থায়ী ঠিকানায় ভুল পোস্টকোড প্রদান',
      'বৈবাহিক তথ্যে স্পাউজের নাম ভুল এন্ট্রি'
    ],
    preparationInstructionsBn: [
      'আপনার NID ডাটাবেজে নাম ও জন্মতারিখ ঠিক আছে কিনা তা নিশ্চিত করুন।',
      'পাসপোর্ট চালানের সরকারি ফি (৪৮ পাতা ১০ বছর: ৳৫,৭৫০ / ৪৮ পাতা ৫ বছর: ৳৪,০২৫) নিশ্চিত করুন।'
    ],
    checklistItemsBn: [
      'মূল NID / ১৭ ডিজিটের অনলাইন জন্ম নিবন্ধন আছে',
      'স্থায়ী ও বর্তমান ঠিকানার সঠিক পোস্টকোড জানা আছে',
      'পিতা ও মাতার NID নম্বর নিশ্চিত',
      'জরুরি যোগাযোগের ব্যক্তির মোবাইল নম্বর ও ঠিকানা প্রস্তুত'
    ],
    officialSourceUrl: 'https://www.epassport.gov.bd',
    officialSourceTitle: 'Department of Immigration & Passports, Bangladesh',
    lastVerifiedDate: '2026-10-10',
    verificationStatus: 'VERIFIED',
    isActive: true
  },
  {
    id: 'srv-birth-reg',
    slug: 'birth-registration-correction',
    titleBn: 'অনলাইন জন্ম নিবন্ধন আবেদন ও তথ্য সংশোধন',
    titleEn: 'Digital Birth Registration & Correction Assistance',
    category: 'CIVIL_REG',
    descriptionBn: 'নতুন ডিজিটাল জন্ম নিবন্ধনের ১৭ ডিজিট আবেদন, ইংরেজি ভার্সন সংযোজন, নাম ও জন্ম তারিখ সংশোধনের অনলাইন আবেদন।',
    descriptionEn: 'Assistance with 17-digit digital birth registration, English name translation, and official correction petitions.',
    targetAudience: 'সকল বয়সের নাগরিক ও অভিভাবকবৃন্দ',
    requiredDocs: [
      { nameBn: 'ইপিআই (টিকা) কার্ড বা হাসপাতালের জন্ম প্রত্যয়নপত্র', nameEn: 'EPI Vaccination Card or Hospital Birth Certificate', type: 'ORIGINAL', isOptional: false, acceptedFormats: ['image/jpeg', 'application/pdf'], maxSizeBytes: 3145728 },
      { nameBn: 'পিতা ও মাতার ডিজিটাল জন্ম নিবন্ধন ও NID কার্ড', nameEn: 'Parents Digital Birth Reg & NID', type: 'SCAN', isOptional: false, acceptedFormats: ['image/jpeg', 'application/pdf'], maxSizeBytes: 5242880 },
      { nameBn: 'ইউপি চেয়ারম্যান বা কাউন্সিলর প্রত্যয়নপত্র', nameEn: 'Local Chairman / Councilor Certificate', type: 'ORIGINAL', isOptional: false, acceptedFormats: ['image/jpeg', 'application/pdf'], maxSizeBytes: 2097152 },
      { nameBn: 'হোল্ডিং ট্যাক্স রসিদ বা বাড়ি/জমির দলিল', nameEn: 'Holding Tax Receipt or Land Record', type: 'SCAN', isOptional: false, acceptedFormats: ['image/jpeg', 'application/pdf'], maxSizeBytes: 3145728 }
    ],
    orderedFields: [
      { order: 1, key: 'applicantNameBn', labelBn: 'নাম (বাংলা)', labelEn: 'Name in Bangla', type: 'text', required: true },
      { order: 2, key: 'applicantNameEn', labelBn: 'নাম (ইংরেজি)', labelEn: 'Name in English', type: 'text', required: true },
      { order: 3, key: 'dob', labelBn: 'জন্ম তারিখ', labelEn: 'Date of Birth', type: 'date', required: true },
      { order: 4, key: 'gender', labelBn: 'লিঙ্গ', labelEn: 'Gender', type: 'select', required: true, options: ['পুরুষ (Male)', 'মহিলা (Female)', 'অন্যান্য (Other)'] },
      { order: 5, key: 'fatherBirthRegNo', labelBn: 'পিতার ১৭ ডিজিট ডিজিটাল জন্ম নিবন্ধন নম্বর', labelEn: 'Father 17-Digit BRC', type: 'text', required: true },
      { order: 6, key: 'motherBirthRegNo', labelBn: 'মাতার ১৭ ডিজিট ডিজিটাল জন্ম নিবন্ধন নম্বর', labelEn: 'Mother 17-Digit BRC', type: 'text', required: true },
      { order: 7, key: 'birthPlaceAddress', labelBn: 'জন্মস্থানের ঠিকানা (গ্রাম, ওয়ার্ড, ইউনিয়ন/পৌরসভা)', labelEn: 'Birth Place Address', type: 'textarea', required: true },
      { order: 8, key: 'permanentAddress', labelBn: 'স্থায়ী ঠিকানা', labelEn: 'Permanent Address', type: 'textarea', required: true }
    ],
    officialGovtFeeBdt: 50,
    shopServiceChargeBdt: 120,
    estimatedProcessingTime: '২০ থেকে ৩০ মিনিট',
    deliveryModes: ['ONLINE_DOWNLOAD', 'SHOP_PICKUP'],
    whatToBringToShopBn: [
      'টিকা কার্ড বা হাসপাতালের ছাড়পত্র',
      'পিতা-মাতার ডিজিটাল জন্ম নিবন্ধনের কপি ও NID',
      'হোল্ডিং ট্যাক্সের হালনাগাদ রসিদ'
    ],
    commonMistakesBn: [
      'পিতা-মাতার জন্ম নিবন্ধন ১৭ ডিজিটের অনলাইন না থাকা',
      'ইংরেজি নামের বানানের সাথে পাসপোর্টের অমিল',
      'জন্মস্থানের ভুল ওয়ার্ড বা ইউনিয়ন নির্বাচন'
    ],
    preparationInstructionsBn: [
      '২০০০ সালের পর জন্ম হলে পিতা-মাতার অনলাইন জন্ম নিবন্ধন নম্বর বাধ্যতামূলক।',
      'আবেদন করার পর প্রিন্ট কপি ইউনিয়ন পরিষদ বা ওয়ার্ড কাউন্সিলর অফিসে জমা দিতে হবে।'
    ],
    checklistItemsBn: [
      'টিকা কার্ড বা চিকিৎসা সনদের স্ক্যান কপি প্রস্তুত',
      'পিতা ও মাতার ১৭ ডিজিটের অনলাইন জন্ম নিবন্ধন সনদ প্রস্তুত',
      'হোল্ডিং ট্যাক্স রসিদ প্রস্তুত'
    ],
    officialSourceUrl: 'https://bdris.gov.bd',
    officialSourceTitle: 'Office of the Registrar General, Birth and Death Registration (BDRIS)',
    lastVerifiedDate: '2026-10-18',
    verificationStatus: 'VERIFIED',
    isActive: true
  },
  {
    id: 'srv-nid-correction',
    slug: 'nid-correction-reissue',
    titleBn: 'জাতীয় পরিচয়পত্র (NID) সংশোধন ও রি-ইস্যু আবেদন',
    titleEn: 'National ID (NID) Correction & Lost Reissue',
    category: 'NID',
    descriptionBn: 'NID কার্ডে নিজের নাম, পিতা-মাতার নাম, রক্তের গ্রুপ, জন্ম তারিখ সংশোধন অথবা হারানো কার্ড উত্তোলনের সরকারি আবেদন।',
    descriptionEn: 'Official EC portal filing for NID corrections, data updates, and lost smart-card reissue.',
    targetAudience: 'জাতীয় পরিচয়পত্রধারী সকল নাগরিক',
    requiredDocs: [
      { nameBn: 'বর্তমান NID কপি বা নম্বর', nameEn: 'Current NID Copy or Number', type: 'SCAN', isOptional: false, acceptedFormats: ['image/jpeg', 'application/pdf'], maxSizeBytes: 3145728 },
      { nameBn: 'এসএসসি / সমমানের শিক্ষাগত সনদ (বয়স ও নাম প্রমাণের জন্য)', nameEn: 'SSC or Equivalent Certificate', type: 'ORIGINAL', isOptional: false, acceptedFormats: ['image/jpeg', 'application/pdf'], maxSizeBytes: 5242880 },
      { nameBn: 'অনলাইন ১৭ ডিজিটের জন্ম নিবন্ধন সনদ', nameEn: 'Online 17-digit Birth Certificate', type: 'ORIGINAL', isOptional: false, acceptedFormats: ['image/jpeg', 'application/pdf'], maxSizeBytes: 3145728 },
      { nameBn: 'পিতা ও মাতার NID কপি (পিতা/মাতার নাম সংশোধনের ক্ষেত্রে)', nameEn: 'Parents NID Copies', type: 'SCAN', isOptional: true, acceptedFormats: ['image/jpeg', 'application/pdf'], maxSizeBytes: 3145728 },
      { nameBn: 'থানার সাধারণ ডায়েরি (GD) কপি (হারানো কার্ড উত্তোলনের জন্য)', nameEn: 'Police GD Copy (for lost card)', type: 'ORIGINAL', isOptional: true, acceptedFormats: ['image/jpeg', 'application/pdf'], maxSizeBytes: 3145728 }
    ],
    orderedFields: [
      { order: 1, key: 'nidNumber', labelBn: 'বিদ্যমান NID নম্বর', labelEn: 'Existing NID Number', type: 'text', required: true },
      { order: 2, key: 'dob', labelBn: 'জন্ম তারিখ', labelEn: 'Date of Birth', type: 'date', required: true },
      { order: 3, key: 'correctionType', labelBn: 'সংশোধনের ধরণ', labelEn: 'Correction Type', type: 'select', required: true, options: ['নিজের নাম সংশোধন (Bangla/English)', 'পিতা বা মাতার নাম সংশোধন', 'জন্ম তারিখ সংশোধন', 'ঠিকানা বা রক্তের গ্রুপ পরিবর্তন', 'হারানো NID রি-ইস্যু (Reissue)'] },
      { order: 4, key: 'correctedValueWanted', labelBn: 'সংশোধিত কাঙ্ক্ষিত তথ্য (যাহা লিখতে হবে)', labelEn: 'Corrected Information Desired', type: 'textarea', required: true },
      { order: 5, key: 'supportingDocReference', labelBn: 'প্রমাণক সনদের বিবরণ (সনদের রোল, রেজি, বা কোড)', labelEn: 'Supporting Certificate Reference', type: 'text', required: true }
    ],
    officialGovtFeeBdt: 230,
    shopServiceChargeBdt: 150,
    estimatedProcessingTime: '২০ থেকে ৪০ মিনিট',
    deliveryModes: ['ONLINE_DOWNLOAD', 'SHOP_PICKUP'],
    whatToBringToShopBn: [
      'মূল এসএসসি সনদ বা মূল জন্ম সনদ',
      'বর্তমান NID কার্ডের কপি বা নম্বর',
      'পিতা/মাতার NID ফটোকপি (প্রয়োজনে)'
    ],
    commonMistakesBn: [
      'উপযুক্ত সরকারি প্রমাণক সনদ ছাড়া বড় ধরণের নাম বা বয়স পরিবর্তনের আবেদন',
      'হারানো কার্ডের ক্ষেত্রে থানার জিডি ছাড়া আবেদন করা'
    ],
    preparationInstructionsBn: [
      'নির্বাচন কমিশনের রকেট/বিকাশের মাধ্যমে সরকারি ফি পরিশোধ করতে হয়।',
      'সংশোধনের স্বপক্ষে অকাট্য প্রমাণক কাগজপত্র স্ক্যান করে জমা দিতে হবে।'
    ],
    checklistItemsBn: [
      'বর্তমান NID নম্বর নিশ্চিত',
      'এসএসসি বা মূল সনদ প্রস্তুত',
      'মোবাইল নম্বর ও ফেস ভেরিফিকেশনের জন্য উপস্থিত থাকা'
    ],
    officialSourceUrl: 'https://services.nidw.gov.bd',
    officialSourceTitle: 'Bangladesh Election Commission NID Wing',
    lastVerifiedDate: '2026-10-12',
    verificationStatus: 'VERIFIED',
    isActive: true
  },
  {
    id: 'srv-tin-cert',
    slug: 'tin-certificate-registration',
    titleBn: 'ই-টিআইএন (e-TIN) সার্টিফিকেট ও আয়কর সহায়তা',
    titleEn: 'e-TIN Registration & Tax Certificate',
    category: 'TAX_TIN',
    descriptionBn: 'জাতীয় রাজস্ব বোর্ডের (NBR) অনলাইন পোর্টালে ৫ মিনিটে তাৎক্ষণিক নতুন ১২ ডিজিটের ই-টিআইএন সার্টিফিকেট উত্তোলন ও প্রিন্ট।',
    descriptionEn: 'Instant 12-digit e-TIN registration, PDF certificate generation and tax consultation.',
    targetAudience: 'ব্যবসায়ী, চাকুরীজীবী, সঞ্চয়পত্র ক্রেতা ও গাড়ি/জমি ক্রেতা',
    requiredDocs: [
      { nameBn: 'মূল জাতীয় পরিচয়পত্র (NID) নম্বর ও জন্ম তারিখ', nameEn: 'NID Number & Exact Date of Birth', type: 'ORIGINAL', isOptional: false, acceptedFormats: ['image/jpeg', 'application/pdf'], maxSizeBytes: 3145728 },
      { nameBn: 'সক্রিয় মোবাইল নম্বর (ওটিপির জন্য)', nameEn: 'Active Mobile Number for OTP', type: 'ORIGINAL', isOptional: false, acceptedFormats: ['text/plain'], maxSizeBytes: 1024 }
    ],
    orderedFields: [
      { order: 1, key: 'nidNumber', labelBn: 'NID নম্বর', labelEn: 'NID Number', type: 'text', required: true },
      { order: 2, key: 'dob', labelBn: 'জন্ম তারিখ', labelEn: 'Date of Birth', type: 'date', required: true },
      { order: 3, key: 'applicantPhone', labelBn: 'সক্রিয় মোবাইল নম্বর', labelEn: 'Active Mobile Number', type: 'text', required: true },
      { order: 4, key: 'tinPurpose', labelBn: 'টিআইএন গ্রহণের উদ্দেশ্য', labelEn: 'Purpose of TIN', type: 'select', required: true, options: ['সঞ্চয়পত্র ক্রয় / ব্যাংক লোন', 'ব্যবসা বা ট্রেড লাইসেন্স', 'গাড়ি ক্রয় বা রেজিস্ট্রেশন', 'চাকরি বা আয়কর রিটার্ন দাখিল', 'অন্যান্য'] },
      { order: 5, key: 'currentAddress', labelBn: 'বর্তমান কর্মস্থল বা বাসার ঠিকানা', labelEn: 'Present Address', type: 'textarea', required: true }
    ],
    officialGovtFeeBdt: 0,
    shopServiceChargeBdt: 100,
    estimatedProcessingTime: '১০ থেকে ১৫ মিনিট',
    deliveryModes: ['ONLINE_DOWNLOAD', 'SHOP_PICKUP'],
    whatToBringToShopBn: [
      'আপনার স্মার্ট বা নরমাল NID কার্ড',
      'আপনার সাথে থাকা সচল মোবাইল ফোন (OTP ভেরিফিকেশনের জন্য)'
    ],
    commonMistakesBn: [
      'পূর্বে টিআইএন থাকা সত্ত্বেও ভুলে নতুন টিআইএন আবেদন করা (এক ব্যক্তির দুটি টিআইএন আইনত দণ্ডনীয়)'
    ],
    preparationInstructionsBn: [
      'অনলাইনে NID ও জন্মতারিখ ম্যাচ করলেই তাৎক্ষণিক এনবিআর সার্টিফিকেট প্রিন্ট হয়ে যায়।'
    ],
    checklistItemsBn: [
      'NID নম্বর ও জন্মতারিখ নির্ভুল আছে',
      'মোবাইল সাথে আছে এবং এসএমএস আসে'
    ],
    officialSourceUrl: 'https://secure.incometax.gov.bd/TINHome',
    officialSourceTitle: 'National Board of Revenue (NBR) e-TIN Portal',
    lastVerifiedDate: '2026-10-16',
    verificationStatus: 'VERIFIED',
    isActive: true
  },
  {
    id: 'srv-visa-doc',
    slug: 'visa-document-preparation',
    titleBn: 'ভিসা আবেদন ও ডকুমেন্ট প্রসেসিং সহায়তা (India, Dubai, Saudi)',
    titleEn: 'Visa Application & Document Preparation',
    category: 'VISA',
    descriptionBn: 'ভারত, দুবাই, সৌদি আরব, থাইল্যান্ড ও মালয়েশিয়া ট্যুরিস্ট/মেডিকেল ভিসার অনলাইন ফরম পূরণ, ছবি সাইজ রিসাইজ, হোটেল ও ফ্লাইট ডামি বুকিং পেপার প্রস্তুত।',
    descriptionEn: 'Visa documentation, Indian IVAC application, embassy photo presets, and appointment assistance.',
    targetAudience: 'বিদেশগামী যাত্রী, ওমরাহ ও পর্যটকবৃন্দ',
    requiredDocs: [
      { nameBn: 'মূল পাসপোর্ট (কমপক্ষে ৬ মাস মেয়াদ)', nameEn: 'Original Passport (min 6 months validity)', type: 'ORIGINAL', isOptional: false, acceptedFormats: ['application/pdf', 'image/jpeg'], maxSizeBytes: 10485760 },
      { nameBn: 'সাদা ব্যাকগ্রাউন্ডের ভিসা সাইজ ছবি (২x২ ইঞ্চি)', nameEn: '2x2 Inch Visa Photo', type: 'PHOTO', isOptional: false, acceptedFormats: ['image/jpeg', 'image/png'], maxSizeBytes: 1048576 },
      { nameBn: 'জাতীয় পরিচয়পত্র (NID) ও ইউটিলিটি বিলের কপি', nameEn: 'NID & Electricity/Gas Bill Copy', type: 'SCAN', isOptional: false, acceptedFormats: ['application/pdf', 'image/jpeg'], maxSizeBytes: 3145728 },
      { nameBn: 'ব্যাংক স্টেটমেন্ট ও সলভেন্সি সার্টিফিকেট', nameEn: 'Bank Statement & Solvency Certificate', type: 'ORIGINAL', isOptional: false, acceptedFormats: ['application/pdf'], maxSizeBytes: 5242880 },
      { nameBn: 'ট্রেড লাইসেন্স / নো অবজেকশন সার্টিফিকেট (NOC) বা স্টুডেন্ট আইডি', nameEn: 'Trade License or Job NOC or Student ID', type: 'ORIGINAL', isOptional: false, acceptedFormats: ['application/pdf', 'image/jpeg'], maxSizeBytes: 5242880 }
    ],
    photoSpecs: {
      widthPx: 600,
      heightPx: 600,
      maxKb: 300,
      bgColor: '১০০% দুধের মত সাদা ব্যাকগ্রাউন্ড (Pure White)',
      notesBn: 'উভয় কান ও কপাল স্পষ্ট, চোখে চশমা ছাড়া, মুখের অনুপাত ৭০-৮০%।'
    },
    orderedFields: [
      { order: 1, key: 'destinationCountry', labelBn: 'গন্তব্য দেশ', labelEn: 'Destination Country', type: 'select', required: true, options: ['ভারত (India - IVAC)', 'সংযুক্ত আরব আমিরাত (Dubai Tourist)', 'সৌদি আরব (Saudi Tourist/Umrah)', 'থাইল্যান্ড (Thailand)', 'মালয়েশিয়া (Malaysia)'] },
      { order: 2, key: 'passportNumber', labelBn: 'পাসপোর্ট নম্বর', labelEn: 'Passport Number', type: 'text', required: true },
      { order: 3, key: 'passportExpiryDate', labelBn: 'পাসপোর্টের মেয়াদোত্তীর্ণের তারিখ', labelEn: 'Passport Expiry Date', type: 'date', required: true },
      { order: 4, key: 'applicantNameEn', labelBn: 'আবেদনকারীর পুরো নাম (পাসপোর্ট অনুযায়ী)', labelEn: 'Full Name as in Passport', type: 'text', required: true },
      { order: 5, key: 'profession', labelBn: 'পেশা ও কর্মস্থলের বিবরণ', labelEn: 'Profession & Employer Details', type: 'text', required: true },
      { order: 6, key: 'travelDateExpected', labelBn: 'সম্ভাব্য ভ্রমণের তারিখ', labelEn: 'Expected Travel Date', type: 'date', required: true }
    ],
    officialGovtFeeBdt: 800,
    shopServiceChargeBdt: 400,
    estimatedProcessingTime: '৩০ থেকে ৬০ মিনিট',
    deliveryModes: ['ONLINE_DOWNLOAD', 'SHOP_PICKUP'],
    whatToBringToShopBn: [
      'মূল পাসপোর্ট',
      'বিদ্যুৎ বিলের কপি',
      'ব্যাংক স্টেটমেন্ট (কমপক্ষে ২০,০০০+ টাকা ব্যালেন্স)',
      'পেশাগত কাগজপত্র (NOC বা ভিজিটিং কার্ড)'
    ],
    commonMistakesBn: [
      'পাসপোর্টের নামের বানানের সাথে বিল বা NID-র ব্যাপক অমিল',
      'ছবিতে ব্যাকগ্রাউন্ড হালকা অফ-হোয়াইট হওয়া (দূতাবাস বাতিল করে)'
    ],
    preparationInstructionsBn: [
      'ভারতীয় ভিসার ক্ষেত্রে ইউটিলিটি বিলের বর্তমান ঠিকানা ফরমের বর্তমান ঠিকানার সাথে হুবহু মিলতে হবে।'
    ],
    checklistItemsBn: [
      'পাসপোর্টের মেয়াদ ৬ মাসের বেশি আছে',
      'ব্যাংক স্টেটমেন্টে সিল ও স্বাক্ষর আছে',
      '২x২ ইঞ্চি সাইজের ল্যাব প্রিন্ট ছবি তোলা আছে'
    ],
    officialSourceUrl: 'https://indianvisaonline.gov.bd',
    officialSourceTitle: 'Indian Visa Application Center (IVAC) Bangladesh',
    lastVerifiedDate: '2026-10-14',
    verificationStatus: 'VERIFIED',
    isActive: true
  },
  {
    id: 'srv-photo-studio',
    slug: 'photo-resizing-printing',
    titleBn: 'ছবি রিসাইজ, ব্যাকগ্রাউন্ড চেঞ্জ ও প্রিন্টিং স্টুডিও',
    titleEn: 'Instant Photo Resizing, Background & Print Sheets',
    category: 'PHOTO_DOC',
    descriptionBn: 'যেকোনো সরকারি চাকরির (৩০০x৩০০, ১০০KB), পাসপোর্টের (৪৫x৩৫মিমি), স্ট্যাম্প সাইজ ও ৪R/A4 শিট প্রিন্ট প্রিসেট সহ তাত্ক্ষণিক ফটো এডিটিং।',
    descriptionEn: 'Browser-based photo cropping, resizing presets, background white replacement, and printable sheet generator.',
    targetAudience: 'সকল শিক্ষার্থী, চাকরিপ্রার্থী ও কম্পিউটার ইউজার',
    requiredDocs: [
      { nameBn: 'আপনার বর্তমান যেকোনো পরিষ্কার ছবি বা সেলফি', nameEn: 'Clear portrait photo or selfie', type: 'PHOTO', isOptional: false, acceptedFormats: ['image/jpeg', 'image/png'], maxSizeBytes: 10485760 }
    ],
    orderedFields: [
      { order: 1, key: 'presetType', labelBn: 'প্রিসেট সাইজ নির্বাচন করুন', labelEn: 'Select Preset Size', type: 'select', required: true, options: ['টেলিটক সরকারি চাকরি (300x300 px, <100KB)', 'টেলিটক ডিজিটাল স্বাক্ষর (300x80 px, <60KB)', 'পাসপোর্ট সাইজ (45x35 mm, White BG)', 'স্ট্যাম্প সাইজ (25x20 mm)', 'আমেরিকান / ভিসা সাইজ (2x2 Inch)', '4R প্রিন্ট শিট (4 Copies)', 'A4 প্রিন্ট শিট (8-10 Copies)'] },
      { order: 2, key: 'copiesNeeded', labelBn: 'প্রিন্ট কপির সংখ্যা (প্রিন্ট চাইলে)', labelEn: 'Copies Needed', type: 'number', required: false },
      { order: 3, key: 'deliveryPreference', labelBn: 'ডেলিভারি মাধ্যম', labelEn: 'Delivery Preference', type: 'select', required: true, options: ['শুধুমাত্র ডিজিটাল ডাউনলোড (Online Download)', 'দোকান কাউন্টার থেকে প্রিন্ট কপি সংগ্রহ', 'হোম ডেলিভারি (কুরিয়ার)'] }
    ],
    officialGovtFeeBdt: 0,
    shopServiceChargeBdt: 40,
    estimatedProcessingTime: '৫ থেকে ১০ মিনিট',
    deliveryModes: ['ONLINE_DOWNLOAD', 'SHOP_PICKUP', 'COURIER'],
    whatToBringToShopBn: [
      'আপনার ফোনের যেকোনো পাসপোর্ট ছবি বা স্টুডিওতে সরাসরি এসে ছবি তোলার সুযোগ রয়েছে'
    ],
    commonMistakesBn: [
      'অস্পষ্ট বা লো রেজ্যুলেশনের ছবি আপলোড করা'
    ],
    preparationInstructionsBn: [
      'আমাদের অনলাইন ফটো টুল ব্যবহার করে মুহূর্তের মধ্যেই নিখুঁত সাইজে রিসাইজ করে ডাউনলোড করতে পারেন।'
    ],
    checklistItemsBn: [
      'ছবিতে মুখ স্পষ্ট বোঝা যাচ্ছে',
      'প্রয়োজনীয় সাইজ প্রিসেট ঠিকভাবে নির্বাচন করা হয়েছে'
    ],
    officialSourceUrl: 'https://businessos.local',
    officialSourceTitle: 'BusinessOS Studio & Photo Engine',
    lastVerifiedDate: '2026-10-20',
    verificationStatus: 'VERIFIED',
    isActive: true
  },
  {
    id: 'srv-real-estate-walkthrough',
    slug: 'real-estate-walkthrough-editing',
    titleBn: 'রিয়েল এস্টেট প্রপার্টি ওয়াকথ্রু ভিডিও এডিটিং',
    titleEn: 'Real Estate Walkthrough Video Editing',
    category: 'VIDEO_EDITING',
    descriptionBn: 'সিনেমেটিক প্রপার্টি ট্যুর, ড্রোন ফুটেজ স্ট্যাবিলাইজেশন, কালার গ্রেডিং, ফ্লোর প্ল্যান এবং ব্র্যান্ডেড ইনফরমেশন কলআউট।',
    descriptionEn: 'High-end cinematic property walkthrough editing with drone stabilization, LUT color grading, motion title cards, and floor plans.',
    targetAudience: 'রিয়েল এস্টেট ডেভেলপার, ল্যান্ডলর্ড, ব্রোকার ও আর্কিটেক্ট',
    requiredDocs: [
      { nameBn: 'প্রজেক্ট ব্রিফ ও স্পেসিফিকেশন', nameEn: 'Project Brief / Google Doc', type: 'SCAN', isOptional: false, acceptedFormats: ['application/pdf', 'text/plain'], maxSizeBytes: 5242880, notesBn: 'প্রপার্টি সাইজ, রুম সংখ্যা, ফিচার ও হাইলাইটস' },
      { nameBn: 'র ফুটেজ লিঙ্ক (Drive/Dropbox/WeTransfer)', nameEn: 'Raw Footage Cloud Link', type: 'SCAN', isOptional: false, acceptedFormats: ['text/plain', 'application/pdf'], maxSizeBytes: 1048576, notesBn: 'ক্লিপ ডাউনলোড লিঙ্ক ও অডিও ফাইল' },
      { nameBn: 'কোম্পানি লোগো ও ব্র্যান্ড কালার', nameEn: 'Brand Logo & Guidelines', type: 'PHOTO', isOptional: true, acceptedFormats: ['image/png', 'image/jpeg'], maxSizeBytes: 5242880 }
    ],
    orderedFields: [
      { order: 1, key: 'footageLink', labelBn: 'কাঁচা ফুটেজ ডাউনলোড লিঙ্ক (Drive / Dropbox)', labelEn: 'Raw Footage Cloud Link', type: 'text', required: true },
      { order: 2, key: 'aspectRatio', labelBn: 'ভিডিও এসপেক্ট রেশিও', labelEn: 'Aspect Ratio', type: 'select', required: true, options: ['16:9 (Landscape 4K/1080p - YouTube & Website)', '9:16 (Vertical Full HD - Reels & TikTok)', '1:1 (Square - Feed Ad)', 'Both 16:9 and 9:16 Bundle'] },
      { order: 3, key: 'targetDuration', labelBn: 'টার্গেট ডিউরেশন', labelEn: 'Target Duration', type: 'select', required: true, options: ['Short Highlight (30 - 60s)', 'Full Walkthrough (2 - 3 minutes)', 'Extended Architectural Tour (5+ minutes)'] },
      { order: 4, key: 'musicMood', labelBn: 'ব্যাকগ্রাউন্ড মিউজিক মুড', labelEn: 'Background Music Mood', type: 'select', required: true, options: ['Luxury & Elegant Piano/Ambient', 'Modern Corporate & Energetic', 'Cinematic Drone Acoustic', 'No Music (Natural Audio Only)'] },
      { order: 5, key: 'propertyHighlights', labelBn: 'প্রপার্টির বিশেষ হাইলাইটস', labelEn: 'Property Key Highlights', type: 'textarea', required: false, helpTextBn: 'উদাঃ সুইমিং পুল, মাস্টার বেডরুম, সাউথ ফেসিং বারান্দা ইত্যাদি।' }
    ],
    officialGovtFeeBdt: 0,
    shopServiceChargeBdt: 3500,
    estimatedProcessingTime: '২৪ থেকে ৪৮ ঘণ্টা',
    deliveryModes: ['ONLINE_DOWNLOAD'],
    whatToBringToShopBn: ['পেনড্রাইভ বা এক্সটারনাল হার্ডড্রাইভে 4K/HD র ফুটেজ নিয়ে আসতে পারেন অথবা ড্রাইভ লিঙ্ক দিতে পারেন।'],
    commonMistakesBn: ['খুব বেশি কাঁপুনি যুক্ত ফুটেজ বা কম আলোতে ধারণকৃত ফুটেজ', 'সম্পূর্ণ ফুটেজ একসাথে জিপ না করে এলোমেলো আপলোড'],
    preparationInstructionsBn: ['আপনার ব্র্যান্ড লোগো পিএনজি ফরম্যাটে এবং সঠিক ঠিকানার ইনফো টেক্সট ফাইলে প্রস্তুত রাখুন।'],
    checklistItemsBn: ['ফুটেজ ক্লাউড লিংক এক্সেস পাবলিক বা ভিউয়ার অনুমতি দেওয়া', 'দরকারি টেক্সট বা প্রপার্টি বিবরণ দেওয়া হয়েছে'],
    officialSourceUrl: 'https://businessos.local/services/video-editing',
    officialSourceTitle: 'BusinessOS Creative Media Labs',
    lastVerifiedDate: '2026-10-21',
    verificationStatus: 'VERIFIED',
    isActive: true
  },
  {
    id: 'srv-real-estate-reels',
    slug: 'real-estate-reels-short-form',
    titleBn: 'রিয়েল এস্টেট রিলস ও শর্ট-ফর্ম ভিডিও এডিটিং',
    titleEn: 'Real Estate Reels & TikToks Short-Form',
    category: 'VIDEO_EDITING',
    descriptionBn: 'ইনস্টাগ্রাম, ফেসবুক ও টিকটকের জন্য আকর্ষণীয় হুক, গতিশীল কাট, সাবটাইটেল এবং সাউন্ড ইফেক্ট সম্বলিত ভাইরাল রিলস।',
    descriptionEn: 'High-retention vertical 9:16 short-form reels for real estate agents with animated captions, speed ramps, and trending beats.',
    targetAudience: 'রিয়েলটর, কনটেন্ট ক্রিয়েটর ও ডিজিটাল এজেন্সি',
    requiredDocs: [
      { nameBn: 'ভার্টিক্যাল ভিডিও ক্লিপস বা ড্রাইভ লিংক', nameEn: 'Raw Mobile/Camera Clips', type: 'SCAN', isOptional: false, acceptedFormats: ['text/plain', 'application/pdf'], maxSizeBytes: 1048576 },
      { nameBn: 'এজেন্ট ছবি বা ব্র্যান্ড লোগো', nameEn: 'Agent Photo / Logo', type: 'PHOTO', isOptional: true, acceptedFormats: ['image/png', 'image/jpeg'], maxSizeBytes: 5242880 }
    ],
    orderedFields: [
      { order: 1, key: 'footageLink', labelBn: 'ভিডিও ফুটেজ গুগল ড্রাইভ / ড্রপবক্স লিঙ্ক', labelEn: 'Raw Footage Link', type: 'text', required: true },
      { order: 2, key: 'reelTheme', labelBn: 'রিলস স্টাইল', labelEn: 'Reel Style', type: 'select', required: true, options: ['Fast Paced with Alex Hormozi Captions', 'Cinematic Aesthetic Luxury', 'Voiceover + B-Roll Tour', 'Price Quiz / Hook Style'] },
      { order: 3, key: 'hookText', labelBn: 'প্রথম ৩ সেকেন্ডের হুক টেক্সট (ঐচ্ছিক)', labelEn: 'Hook Text (Optional)', type: 'text', required: false }
    ],
    officialGovtFeeBdt: 0,
    shopServiceChargeBdt: 1200,
    estimatedProcessingTime: '১২ থেকে ২৪ ঘণ্টা',
    deliveryModes: ['ONLINE_DOWNLOAD'],
    whatToBringToShopBn: ['মোবাইল বা ক্যামেরার রিলস ফুটেজ পেনড্রাইভে নিয়ে আসুন।'],
    commonMistakesBn: ['হরিজোন্টাল ফুটেজ জোর করে ক্রপ করা', 'অস্পষ্ট কথা বা নয়েজপূর্ণ অডিও'],
    preparationInstructionsBn: ['আপনার রিলসের প্রথম ৩ সেকেন্ডের কথা বা হুক ঠিক করে দিন।'],
    checklistItemsBn: ['ফুটেজ লিঙ্ক পাবলিকলি ডাউনলোডযোগ্য', 'সাবটাইটেলের জন্য স্পেলিং নিশ্চিত করা'],
    officialSourceUrl: 'https://businessos.local/services/video-editing',
    officialSourceTitle: 'BusinessOS Video Studio',
    lastVerifiedDate: '2026-10-21',
    verificationStatus: 'VERIFIED',
    isActive: true
  },
  {
    id: 'srv-talking-head-editing',
    slug: 'talking-head-editing',
    titleBn: 'ইউটিউব ও কোর্স টকিং-হেড ভিডিও এডিটিং',
    titleEn: 'Talking-Head YouTube & Course Video Editing',
    category: 'VIDEO_EDITING',
    descriptionBn: 'ইউটিউব ও অনলাইন কোর্সের জন্য নয়েজ রিমুভাল, কালার কারেকশন, স্মার্ট জুম, প্রাসঙ্গিক বি-রোল, মোশন গ্রাফিক্স ও সাউন্ড ডিজাইন।',
    descriptionEn: 'Professional talking head editing with jump cut cleanup, dynamic zooms, pop-up motion titles, sound FX, and engaging b-roll storytelling.',
    targetAudience: 'ইউটিউবার, ট্রেইনার, শিক্ষক ও পডকাস্টার',
    requiredDocs: [
      { nameBn: 'মূল ভিডিও ফুটেজ লিঙ্ক', nameEn: 'Main A-Roll Footage Link', type: 'SCAN', isOptional: false, acceptedFormats: ['text/plain'], maxSizeBytes: 1048576 },
      { nameBn: 'প্রেজেন্টেশন স্লাইড বা রেফারেন্স (প্রযোজ্য ক্ষেত্রে)', nameEn: 'Slides / Reference Assets', type: 'SCAN', isOptional: true, acceptedFormats: ['application/pdf', 'image/png'], maxSizeBytes: 10485760 }
    ],
    orderedFields: [
      { order: 1, key: 'footageLink', labelBn: 'ফুটেজ ড্রাইভ লিঙ্ক', labelEn: 'Footage Cloud Link', type: 'text', required: true },
      { order: 2, key: 'editingIntensity', labelBn: 'এডিটিং ধরন ও গতি', labelEn: 'Editing Style', type: 'select', required: true, options: ['Clean Course / Educational (Minimalist & Professional)', 'YouTube High-Retention (Fast Cuts, Sound Effects, B-roll)', 'Documentary Style (Cinematic narrative)'] },
      { order: 3, key: 'estimatedMinutes', labelBn: 'ভিডিওর দৈর্ঘ্য (মিনিট)', labelEn: 'Estimated Length in Minutes', type: 'number', required: true }
    ],
    officialGovtFeeBdt: 0,
    shopServiceChargeBdt: 2000,
    estimatedProcessingTime: '২৪ থেকে ৩৬ ঘণ্টা',
    deliveryModes: ['ONLINE_DOWNLOAD'],
    whatToBringToShopBn: ['রেকর্ডকৃত ভিডিও মেমোরি কার্ড বা ড্রাইভে নিয়ে আসতে পারেন।'],
    commonMistakesBn: ['খারাপ অডিও কোয়ালিটি', 'ক্লিপের সাথে কোনো টাইমকোড বা কাট নোট না থাকা'],
    preparationInstructionsBn: ['ভিডিওর অপ্রয়োজনীয় অংশ বা রিটেক নোট দিলে কাজ দ্রুত সম্পন্ন হয়।'],
    checklistItemsBn: ['অডিও আলাদা রেকর্ড থাকলে সেটিও লিঙ্কে যুক্ত করা'],
    officialSourceUrl: 'https://businessos.local/services/video-editing',
    officialSourceTitle: 'BusinessOS Creator Studio',
    lastVerifiedDate: '2026-10-21',
    verificationStatus: 'VERIFIED',
    isActive: true
  },
  {
    id: 'srv-motion-graphics-promo',
    slug: 'motion-graphics-promo',
    titleBn: 'প্রমোশনাল মোশন গ্রাফিক্স ও ২ডি এনিমেশন',
    titleEn: 'Motion Graphics & Brand Promo Videos',
    category: 'VIDEO_EDITING',
    descriptionBn: 'কোম্পানি বা প্রোডাক্ট লঞ্চের আকর্ষণীয় মোশন গ্রাফিক্স, লোগো ইন্ট্রো, টেক্সট এনিমেশন ও বিজ্ঞাপন ভিডিও।',
    descriptionEn: 'Custom 2D motion graphics, brand logo stingers, kinetic typography, and product explainer videos.',
    targetAudience: 'স্টার্টআপ, কর্পোরেট ব্যবসা ও ডিজিটাল মার্কেটার',
    requiredDocs: [
      { nameBn: 'স্ক্রিপ্ট বা ভয়েসওভার ফাইল', nameEn: 'Script or Voiceover Audio', type: 'SCAN', isOptional: false, acceptedFormats: ['text/plain', 'application/pdf'], maxSizeBytes: 5242880 },
      { nameBn: 'ভেক্টর লোগো (AI/EPS/PNG)', nameEn: 'Vector Logo Files', type: 'PHOTO', isOptional: false, acceptedFormats: ['image/png', 'application/pdf'], maxSizeBytes: 10485760 }
    ],
    orderedFields: [
      { order: 1, key: 'scriptText', labelBn: 'ভিডিও স্ক্রিপ্ট বা মেসেজ সংক্ষেপে লিখুন', labelEn: 'Video Script or Message', type: 'textarea', required: true },
      { order: 2, key: 'videoDurationSec', labelBn: 'ভিডিও দৈর্ঘ্য (সেকেন্ড)', labelEn: 'Duration in Seconds', type: 'select', required: true, options: ['15 Seconds (Social Media Stinger / Ad)', '30 Seconds (Standard Commercial)', '60 Seconds (Full Product Explainer)'] }
    ],
    officialGovtFeeBdt: 0,
    shopServiceChargeBdt: 4500,
    estimatedProcessingTime: '২ থেকে ৩ কার্যদিবস',
    deliveryModes: ['ONLINE_DOWNLOAD'],
    whatToBringToShopBn: ['আপনার ব্র্যান্ড কালার কোড ও ভেক্টর লোগো ফাইল।'],
    commonMistakesBn: ['লো রেজ্যুলেশন জেপিজি লোগো দেওয়া', 'ভয়েসওভারের গতি নির্ধারণ না করা'],
    preparationInstructionsBn: ['আপনার কাঙ্ক্ষিত ভিজ্যুয়াল স্টাইলের ১-২টি রেফারেন্স ভিডিও লিংক প্রদান করুন।'],
    checklistItemsBn: ['স্ক্রিপ্ট ফাইনাল ও অনুমোদিত', 'লোগো স্বচ্ছ ব্যাকগ্রাউন্ডে সংরক্ষিত'],
    officialSourceUrl: 'https://businessos.local/services/motion-graphics',
    officialSourceTitle: 'BusinessOS Motion Lab',
    lastVerifiedDate: '2026-10-21',
    verificationStatus: 'VERIFIED',
    isActive: true
  },
  {
    id: 'srv-brand-logo-design',
    slug: 'brand-identity-logo-design',
    titleBn: 'ব্র্যান্ড আইডেন্টিটি ও ভেক্টর লোগো ডিজাইন',
    titleEn: 'Brand Identity & Vector Logo Design',
    category: 'GRAPHIC_DESIGN',
    descriptionBn: 'সম্পূর্ণ ইউনিক, ভেক্টর-বেসড প্রফেশনাল লোগো ডিজাইন, কালার প্যালেট, টাইপোগ্রাফি ও সোশ্যাল মিডিয়া কিট।',
    descriptionEn: 'Comprehensive brand identity design including scalable vector logo, monochrome variants, typography guidelines, and social media branding kit.',
    targetAudience: 'নতুন ব্যবসা প্রতিষ্ঠান, ই-কমার্স ব্র্যান্ড ও শপ ওনার',
    requiredDocs: [
      { nameBn: 'ব্র্যান্ড নেইম ও সংক্ষিপ্ত কনসেপ্ট', nameEn: 'Brand Brief & Preferred Style', type: 'SCAN', isOptional: false, acceptedFormats: ['text/plain', 'application/pdf'], maxSizeBytes: 2097152 }
    ],
    orderedFields: [
      { order: 1, key: 'businessName', labelBn: 'ব্যবসা বা ব্র্যান্ডের নাম', labelEn: 'Business Name', type: 'text', required: true },
      { order: 2, key: 'tagline', labelBn: 'স্লোগান / ট্যাগলাইন (যদি থাকে)', labelEn: 'Tagline / Slogan', type: 'text', required: false },
      { order: 3, key: 'industry', labelBn: 'ব্যবসার ধরন / ইন্ডাস্ট্রি', labelEn: 'Industry / Niche', type: 'text', required: true },
      { order: 4, key: 'preferredColors', labelBn: 'পছন্দের কালার টোন', labelEn: 'Preferred Color Scheme', type: 'select', required: true, options: ['Tech Blue & Cyan', 'Luxury Gold & Black', 'Organic Green & Earthy', 'Vibrant Red & Orange', 'Creative Multi-color'] }
    ],
    officialGovtFeeBdt: 0,
    shopServiceChargeBdt: 2500,
    estimatedProcessingTime: '২৪ থেকে ৪৮ ঘণ্টা',
    deliveryModes: ['ONLINE_DOWNLOAD'],
    whatToBringToShopBn: ['আপনার পছন্দের ২-৩টি লোগো রেফারেন্স দেখালে সুবিধা হয়।'],
    commonMistakesBn: ['স্পষ্ট উদ্দেশ্য ও অডিয়েন্স নির্দিষ্ট না করা'],
    preparationInstructionsBn: ['নামের বানান এবং স্লোগান সতর্কতার সাথে যাচাই করে অর্ডার দিন।'],
    checklistItemsBn: ['AI, EPS, SVG, PNG সব ফরম্যাট ডেলিভারি অন্তর্ভুক্ত'],
    officialSourceUrl: 'https://businessos.local/services/graphics',
    officialSourceTitle: 'BusinessOS Design Studio',
    lastVerifiedDate: '2026-10-21',
    verificationStatus: 'VERIFIED',
    isActive: true
  },
  {
    id: 'srv-meta-google-ads',
    slug: 'meta-google-ads-campaign',
    titleBn: 'টার্গেটেড মেটা ও গুগল অ্যাড ক্যাম্পেইন ম্যানেজমেন্ট',
    titleEn: 'Targeted Meta & Google Ads Campaign Management',
    category: 'DIGITAL_MARKETING',
    descriptionBn: 'ফেসবুক ও ইনস্টাগ্রামে সঠিক ক্রেতা টার্গেটিং, পিক্সেল ট্র্যাকিং, কনভার্সন অপ্টিমাইজেশন ও আরও বেশি সেলস জেনারেশন।',
    descriptionEn: 'Data-driven Meta and Google Ads campaign setup, custom audience segmentation, conversion API tracking, and high-ROAS creative management.',
    targetAudience: 'অনলাইন শপ, স্থানীয় রিটেইল ব্র্যান্ড ও সার্ভিস প্রোভাইডার',
    requiredDocs: [
      { nameBn: 'প্রোডাক্ট / সার্ভিস ক্যাটালগ বা ফটো', nameEn: 'Product / Service Media Assets', type: 'PHOTO', isOptional: false, acceptedFormats: ['image/jpeg', 'image/png'], maxSizeBytes: 10485760 }
    ],
    orderedFields: [
      { order: 1, key: 'pageUrl', labelBn: 'ফেসবুক পেইজ বা ওয়েবসাইটের লিঙ্ক', labelEn: 'Facebook Page or Website Link', type: 'text', required: true },
      { order: 2, key: 'campaignGoal', labelBn: 'ক্যাম্পেইনের মূল লক্ষ্য', labelEn: 'Campaign Objective', type: 'select', required: true, options: ['ইনবক্স মেসেজ ও অর্ডার কালেকশন (Messages & WhatsApp)', 'ওয়েবসাইট সেলস ও কনভার্সন (Website Purchase)', 'ব্র্যান্ড অ্যাওয়ারনেস ও পেজ লাইকস (Page Growth)', 'লিড সংগ্রহ ও ফর্ম ফিলাপ (Lead Generation)'] },
      { order: 3, key: 'targetLocation', labelBn: 'টার্গেটেড এরিয়া / শহর', labelEn: 'Target Geography', type: 'text', required: true }
    ],
    officialGovtFeeBdt: 0,
    shopServiceChargeBdt: 1800,
    estimatedProcessingTime: '১২ থেকে ২৪ ঘণ্টা',
    deliveryModes: ['ONLINE_DOWNLOAD'],
    whatToBringToShopBn: ['আপনার ফেসবুক পেজের অ্যাডমিন এক্সেস বা বিজনেস ম্যানেজার লিঙ্ক প্রস্তুত রাখুন।'],
    commonMistakesBn: ['অ্যাড একাউন্ট পলিসি লঙ্ঘন করে এমন নিষিদ্ধ পণ্য প্রচার'],
    preparationInstructionsBn: ['আপনার দৈনিক বাজেট এবং টার্গেট পণ্যের অফার রেডি রাখুন।'],
    checklistItemsBn: ['মেটা বিজনেস ম্যানেজারে পার্টনার বা এক্সেস শেয়ার করা'],
    officialSourceUrl: 'https://businessos.local/services/digital-marketing',
    officialSourceTitle: 'BusinessOS Digital Growth Agency',
    lastVerifiedDate: '2026-10-21',
    verificationStatus: 'VERIFIED',
    isActive: true
  },
  {
    id: 'srv-business-2fa-hardening',
    slug: 'business-2fa-hardening',
    titleBn: 'বিজনেস একাউন্ট ২এফএ সিকিউরিটি ও ব্যাকআপ হার্ডেনিং',
    titleEn: 'Business Account 2FA Security & Backup Hardening',
    category: 'CYBERSECURITY',
    descriptionBn: 'সোশ্যাল মিডিয়া পেজ, বিজনেস ইমেইল এবং অ্যাড অ্যাকাউন্টের হ্যাকিং প্রতিরোধে ২-ফ্যাক্টর অথেনটিকেশন, ব্যাকআপ কি এবং অ্যাক্সেস অডিট।',
    descriptionEn: 'Approved security posture setup: Multi-factor authentication (MFA/2FA), hardware key setup, session revocation, and security audit against account takeover.',
    targetAudience: 'ছোট ও মাঝারি ব্যবসা, শপ ওনার এবং ফেসবুক পেজ অ্যাডমিন',
    requiredDocs: [
      { nameBn: 'ব্যবসা ও পেজের পরিচিতি ডকুমেন্ট', nameEn: 'Page/Business Identity Document', type: 'SCAN', isOptional: false, acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'], maxSizeBytes: 5242880 }
    ],
    orderedFields: [
      { order: 1, key: 'platformToSecure', labelBn: 'যে প্ল্যাটফর্ম নিরাপদ করতে চান', labelEn: 'Platform to Secure', type: 'select', required: true, options: ['ফেসবুক পেজ ও মেটা বিজনেস পোর্টফোলিও', 'গুগল ওয়ার্কস্পেস / জিমেইল বিজনেস একাউন্ট', 'ওয়ার্ডপ্রেস ওয়েবসাইট ও সি-প্যানেল', 'সম্পূর্ণ অল-ইন-ওয়ান বিজনেস সিকিউরিটি সেটআপ'] },
      { order: 2, key: 'contactPhone', labelBn: 'জরুরি যোগাযোগের ফোন নম্বর', labelEn: 'Emergency Contact Phone', type: 'text', required: true }
    ],
    officialGovtFeeBdt: 0,
    shopServiceChargeBdt: 1500,
    estimatedProcessingTime: '২ থেকে ৪ ঘণ্টা (সরাসরি দোকান কাউন্টারে বা রিমোটে)',
    deliveryModes: ['SHOP_PICKUP', 'ONLINE_DOWNLOAD'],
    whatToBringToShopBn: ['নিরাপদ ডিভাইস (ল্যাপটপ বা মোবাইল) সরাসরি দোকানে নিয়ে আসলে সবচেয়ে নিরাপদভাবে সেটআপ করা যায়।'],
    commonMistakesBn: ['টু-ফ্যাক্টর ব্যাকআপ কোড কোথাও সংরক্ষণ না করা'],
    preparationInstructionsBn: ['কখনোই কারো সাথে আপনার পাসওয়ার্ড বা ওটিপি এসএমএস শেয়ার করবেন না।'],
    checklistItemsBn: ['অথেন্টিকেটর অ্যাপে ব্যাকআপ কনফিগার সম্পন্ন', 'জরুরি রিকভারি কোড নিরাপদ প্রিন্ট আকারে সংরক্ষণ'],
    officialSourceUrl: 'https://businessos.local/services/cybersecurity',
    officialSourceTitle: 'BusinessOS IT Security Desk',
    lastVerifiedDate: '2026-10-21',
    verificationStatus: 'VERIFIED',
    isActive: true
  },
  {
    id: 'srv-bulk-document-print',
    slug: 'bulk-document-print-binding',
    titleBn: 'উচ্চগতির ডকুমেন্ট প্রিন্ট, ফটোকপি ও স্পাইরাল বাইন্ডিং',
    titleEn: 'High-Speed Document Print, Photocopy & Binding',
    category: 'PRINT_PHOTOCOPY',
    descriptionBn: 'পিডিএফ বুকলেট প্রিন্ট, সাদা-কালো ও রঙিন ফটোকপি, প্রজেক্ট রিপোর্ট বাইন্ডিং ও ল্যামিনেশন। ফাইল আপলোড করে দোকানে প্রস্তুত পেয়ে যান।',
    descriptionEn: 'High-volume auto-duplex laser printing, monochrome and color copies, spiral comb binding, and thermal lamination.',
    targetAudience: 'শিক্ষার্থী, অফিস সহকারী, শিক্ষক ও যেকোনো সাধারণ গ্রাহক',
    requiredDocs: [
      { nameBn: 'প্রিন্টযোগ্য ফাইল (PDF / Word)', nameEn: 'Print-ready Document', type: 'SCAN', isOptional: false, acceptedFormats: ['application/pdf', 'application/msword'], maxSizeBytes: 52428800 }
    ],
    orderedFields: [
      { order: 1, key: 'paperSize', labelBn: 'কাগজের সাইজ', labelEn: 'Paper Size', type: 'select', required: true, options: ['A4 80 GSM (Standard Office)', 'Legal Size (Stamps & Agreements)', 'Letter Size', '100 GSM Premium Presentation Paper'] },
      { order: 2, key: 'colorMode', labelBn: 'কালার মোড', labelEn: 'Color Mode', type: 'select', required: true, options: ['Black & White (B&W) Laser', 'Full Color Laser (High Resolution)'] },
      { order: 3, key: 'duplex', labelBn: 'প্রিন্ট স্টাইল', labelEn: 'Print Sides', type: 'select', required: true, options: ['Double Sided (বোথ সাইড - পৃষ্ঠা সাশ্রয়ী)', 'Single Sided (এক সাইড)'] },
      { order: 4, key: 'binding', labelBn: 'বাইন্ডিং প্রয়োজন আছে কি?', labelEn: 'Binding Option', type: 'select', required: true, options: ['No Binding (শুধু প্রিন্ট কপি)', 'Spiral Comb Binding with Plastic Covers', 'Stapler Corner Pin', 'Hard Cover Project Binding'] }
    ],
    officialGovtFeeBdt: 0,
    shopServiceChargeBdt: 50,
    estimatedProcessingTime: '১০ থেকে ২০ মিনিট',
    deliveryModes: ['SHOP_PICKUP', 'COURIER'],
    whatToBringToShopBn: ['আপনার টোকেন নম্বর কাউন্টারে দেখিয়ে সরাসরি প্রিন্ট কপি সংগ্রহ করুন।'],
    commonMistakesBn: ['পাসওয়ার্ড প্রটেক্টেড পিডিএফ আপলোড করা'],
    preparationInstructionsBn: ['প্রিন্ট করার আগে ডকুমেন্টের মার্জিন ও পৃষ্ঠা ক্রম ঠিক আছে কিনা দেখে নিন।'],
    checklistItemsBn: ['টোকেন নম্বর সাথে রাখা'],
    officialSourceUrl: 'https://businessos.local/printing',
    officialSourceTitle: 'BusinessOS Print & Copy Station',
    lastVerifiedDate: '2026-10-21',
    verificationStatus: 'VERIFIED',
    isActive: true
  }
];

