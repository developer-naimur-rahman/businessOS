import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

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
  category: 'GOVT_JOB' | 'PASSPORT' | 'CIVIL_REG' | 'NID' | 'VISA' | 'TAX_TIN' | 'BRTA' | 'PHOTO_DOC';
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
  }
];

@Injectable()
export class ServiceKnowledgeService {
  private readonly logger = new Logger(ServiceKnowledgeService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all active services with requirements and knowledge
   */
  async getServices(organizationId?: string): Promise<InternetServiceDef[]> {
    // 1. Fetch any organization-specific overrides or custom services stored in AuditLog
    let customServices: InternetServiceDef[] = [];
    if (organizationId) {
      const logs = await this.prisma.auditLog.findMany({
        where: {
          organizationId,
          entityType: 'InternetServiceDef',
        },
        orderBy: { createdAt: 'desc' },
      });

      customServices = logs.map(l => (l.newData as any) as InternetServiceDef).filter(Boolean);
    }

    // Merge: custom services override defaults by slug or id, or are added as new
    const map = new Map<string, InternetServiceDef>();
    for (const def of DEFAULT_INTERNET_SERVICES) {
      map.set(def.slug, def);
    }
    for (const custom of customServices) {
      if (custom && custom.slug) {
        map.set(custom.slug, custom);
      }
    }

    return Array.from(map.values()).filter(s => s.isActive !== false);
  }

  /**
   * Get single service definition by slug or ID
   */
  async getServiceBySlugOrId(slugOrId: string, organizationId?: string): Promise<InternetServiceDef> {
    const services = await this.getServices(organizationId);
    const service = services.find(s => s.slug === slugOrId || s.id === slugOrId);
    if (!service) {
      throw new NotFoundException(`Internet service '${slugOrId}' not found.`);
    }
    return service;
  }

  /**
   * Create or update a service definition in the knowledge base
   */
  async saveService(organizationId: string, userId: string | null, serviceData: Partial<InternetServiceDef>) {
    const slug = serviceData.slug || serviceData.titleEn?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `service-${Date.now()}`;
    const id = serviceData.id || `srv-${Date.now()}`;

    const completeRecord: InternetServiceDef = {
      id,
      slug,
      titleBn: serviceData.titleBn || 'নতুন অনলাইন সেবা',
      titleEn: serviceData.titleEn || 'New Online Service',
      category: serviceData.category || 'GOVT_JOB',
      descriptionBn: serviceData.descriptionBn || '',
      descriptionEn: serviceData.descriptionEn || '',
      targetAudience: serviceData.targetAudience || 'সাধারণ নাগরিক',
      requiredDocs: serviceData.requiredDocs || [],
      photoSpecs: serviceData.photoSpecs,
      signatureSpecs: serviceData.signatureSpecs,
      orderedFields: serviceData.orderedFields || [],
      officialGovtFeeBdt: Number(serviceData.officialGovtFeeBdt) || 0,
      shopServiceChargeBdt: Number(serviceData.shopServiceChargeBdt) || 50,
      estimatedProcessingTime: serviceData.estimatedProcessingTime || '১৫-৩০ মিনিট',
      deliveryModes: serviceData.deliveryModes || ['ONLINE_DOWNLOAD', 'SHOP_PICKUP'],
      whatToBringToShopBn: serviceData.whatToBringToShopBn || [],
      commonMistakesBn: serviceData.commonMistakesBn || [],
      preparationInstructionsBn: serviceData.preparationInstructionsBn || [],
      checklistItemsBn: serviceData.checklistItemsBn || [],
      officialSourceUrl: serviceData.officialSourceUrl || '',
      officialSourceTitle: serviceData.officialSourceTitle || 'Official Source',
      lastVerifiedDate: new Date().toISOString().split('T')[0],
      verificationStatus: serviceData.verificationStatus || 'VERIFIED',
      isActive: serviceData.isActive !== false,
    };

    const log = await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'InternetServiceDef',
        entityId: id,
        action: 'SAVE_SERVICE_DEF',
        newData: completeRecord as any,
      },
    });

    return {
      success: true,
      service: completeRecord,
      logId: log.id,
    };
  }

  /**
   * Get AI Research proposals waiting for admin review & approval
   */
  async getResearchQueue(organizationId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'ServiceKnowledgeResearch',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return logs.map(l => ({
      id: l.id,
      ...((l.newData as any) || {}),
      createdAt: l.createdAt.toISOString(),
    }));
  }

  /**
   * Submit an AI-researched knowledge update proposal
   */
  async proposeAiResearch(
    organizationId: string,
    proposal: {
      serviceSlug: string;
      sourceUrl: string;
      sourceTitle: string;
      extractedRequirementsBn: string;
      proposedGovtFeeBdt?: number;
      photoSpecs?: any;
      confidenceScore: number;
      notes: string;
    }
  ) {
    const proposalId = `RES-${Date.now()}`;
    const payload = {
      proposalId,
      serviceSlug: proposal.serviceSlug,
      sourceUrl: proposal.sourceUrl,
      sourceTitle: proposal.sourceTitle,
      extractedRequirementsBn: proposal.extractedRequirementsBn,
      proposedGovtFeeBdt: proposal.proposedGovtFeeBdt,
      photoSpecs: proposal.photoSpecs,
      confidenceScore: proposal.confidenceScore,
      notes: proposal.notes,
      status: 'PENDING_REVIEW', // PENDING_REVIEW, APPROVED, REJECTED
      researchedAt: new Date().toISOString(),
    };

    const log = await this.prisma.auditLog.create({
      data: {
        organizationId,
        entityType: 'ServiceKnowledgeResearch',
        entityId: proposalId,
        action: 'PROPOSE_KNOWLEDGE_RESEARCH',
        newData: payload as any,
      },
    });

    return {
      success: true,
      proposalId,
      logId: log.id,
      proposal: payload,
    };
  }

  /**
   * Administrator reviews and approves or rejects an AI research update
   */
  async reviewResearchProposal(
    organizationId: string,
    userId: string | null,
    proposalId: string,
    action: 'APPROVE' | 'REJECT',
    overrides?: Partial<InternetServiceDef>
  ) {
    const log = await this.prisma.auditLog.findFirst({
      where: {
        organizationId,
        entityType: 'ServiceKnowledgeResearch',
        entityId: proposalId,
      },
    });

    if (!log) {
      throw new NotFoundException(`Research proposal '${proposalId}' not found.`);
    }

    const currentData = (log.newData as any) || {};
    const updatedProposal = {
      ...currentData,
      status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      reviewedAt: new Date().toISOString(),
      reviewedBy: userId,
    };

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'ServiceKnowledgeResearch',
        entityId: proposalId,
        action: `REVIEW_${action}_RESEARCH`,
        oldData: currentData,
        newData: updatedProposal,
      },
    });

    if (action === 'APPROVE') {
      // Apply approved changes to the active service definition
      const targetSlug = currentData.serviceSlug;
      const existing = await this.getServiceBySlugOrId(targetSlug, organizationId);
      const updatedService: InternetServiceDef = {
        ...existing,
        ...overrides,
        officialSourceUrl: currentData.sourceUrl || existing.officialSourceUrl,
        officialSourceTitle: currentData.sourceTitle || existing.officialSourceTitle,
        officialGovtFeeBdt: currentData.proposedGovtFeeBdt !== undefined ? Number(currentData.proposedGovtFeeBdt) : existing.officialGovtFeeBdt,
        lastVerifiedDate: new Date().toISOString().split('T')[0],
        verificationStatus: 'VERIFIED',
      };

      await this.saveService(organizationId, userId, updatedService);
      return { success: true, status: 'APPROVED', updatedService };
    }

    return { success: true, status: 'REJECTED' };
  }
}
