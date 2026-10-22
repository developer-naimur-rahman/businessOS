import { NextResponse } from 'next/server';

let serviceKnowledgeStore = [
  {
    id: 'SK-001',
    titleBn: 'ই-পাসপোর্ট রি-ইস্যু ও নতুন আবেদন',
    titleEn: 'e-Passport Application & Renewal',
    slug: 'epassport-renewal',
    category: 'GOVT_JOB',
    descriptionBn: 'জাতীয় পরিচয়পত্র বা অনলাইন জন্মনিবন্ধন অনুযায়ী নির্ভুলভাবে ই-পাসপোর্ট ফরম পূরণ ও চালান জমা।',
    targetAudience: 'সাধারণ নাগরিক, শিক্ষার্থী ও বিদেশযাত্রী',
    officialGovtFeeBdt: 4025,
    shopServiceChargeBdt: 300,
    estimatedProcessingTime: '২০-২৫ মিনিট',
    officialSourceUrl: 'https://epassport.gov.bd',
    officialSourceTitle: 'Department of Immigration & Passports Bangladesh',
    requiredDocuments: ['NID / Digital Birth Certificate', 'Old Passport Copy (if renewal)', 'Citizenship Certificate'],
    isActive: true
  },
  {
    id: 'SK-002',
    titleBn: 'বিআরটিএ ড্রাইভিং লাইসেন্স লার্নার ও স্মার্ট কার্ড',
    titleEn: 'BRTA Driving License Learner & Biometrics',
    slug: 'brta-driving-license',
    category: 'CITIZEN_SERVICE',
    descriptionBn: 'বিএসপি পোর্টালে অনলাইন ড্রাইভিং লাইসেন্স লার্নার পাস ও ফি পেমেন্ট।',
    targetAudience: 'মোটরসাইকেল ও কার চালক',
    officialGovtFeeBdt: 518,
    shopServiceChargeBdt: 200,
    estimatedProcessingTime: '১৫ মিনিট',
    officialSourceUrl: 'https://bsp.brta.gov.bd',
    officialSourceTitle: 'BRTA Service Portal',
    requiredDocuments: ['Medical Certificate Form', 'NID Copy', 'Blood Group Test Report', 'Utility Bill Copy'],
    isActive: true
  },
  {
    id: 'SK-003',
    titleBn: 'অনলাইন জমির খতিয়ান (ই-পর্চা) ও নামজারি',
    titleEn: 'Land Khatian (e-Porcha) & Namzari Mutation',
    slug: 'land-khatian-mutation',
    category: 'LAND_TAX',
    descriptionBn: 'ভূমি সেবা পোর্টালে খতিয়ানের অনলাইন কপি উত্তোলন ও নামজারি আবেদনের ড্রাফটিং।',
    targetAudience: 'জমির মালিক ও উত্তরাধিকারী',
    officialGovtFeeBdt: 120,
    shopServiceChargeBdt: 150,
    estimatedProcessingTime: '১৫-২০ মিনিট',
    officialSourceUrl: 'https://land.gov.bd',
    officialSourceTitle: 'Ministry of Land Bangladesh',
    requiredDocuments: ['National ID', 'Previous Khatian / Dalil Copy', 'Holding Tax Receipt'],
    isActive: true
  },
  {
    id: 'SK-004',
    titleBn: 'ট্যাক্স রিটার্ন দাখিল (e-TIN & PSR)',
    titleEn: 'Online e-TIN & Income Tax Return',
    slug: 'online-etin-tax-return',
    category: 'BUSINESS_REGISTRATION',
    descriptionBn: 'ব্যক্তিগত জিরো রিটার্ন দাখিল ও পিএসআর (Proof of Submission of Return) সার্টিফিকেট ডাউনলোড।',
    targetAudience: 'চাকরিজীবী, ব্যবসায়ী ও ব্যাংক একাউন্ট হোল্ডার',
    officialGovtFeeBdt: 0,
    shopServiceChargeBdt: 350,
    estimatedProcessingTime: '২৫-৩০ মিনিট',
    officialSourceUrl: 'https://etaxnbr.gov.bd',
    officialSourceTitle: 'National Board of Revenue (NBR)',
    requiredDocuments: ['e-TIN Certificate', 'Salary Certificate or Bank Statement', 'NID Number'],
    isActive: true
  }
];

export async function GET() {
  return NextResponse.json(serviceKnowledgeStore);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newService = {
      id: `SK-${Date.now().toString().slice(-4)}`,
      titleBn: body.titleBn || 'নতুন ডিজিটাল সেবা',
      titleEn: body.titleEn || 'New Digital Service',
      slug: body.slug || `svc-${Date.now()}`,
      category: body.category || 'CITIZEN_SERVICE',
      descriptionBn: body.descriptionBn || '',
      targetAudience: body.targetAudience || 'সাধারণ গ্রাহক',
      officialGovtFeeBdt: Number(body.officialGovtFeeBdt || 0),
      shopServiceChargeBdt: Number(body.shopServiceChargeBdt || 100),
      estimatedProcessingTime: body.estimatedProcessingTime || '১৫ মিনিট',
      officialSourceUrl: body.officialSourceUrl || '',
      officialSourceTitle: body.officialSourceTitle || '',
      requiredDocuments: body.requiredDocuments || [],
      isActive: true
    };
    serviceKnowledgeStore.unshift(newService);
    return NextResponse.json(newService, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Creation failed' }, { status: 400 });
  }
}
