import { NextResponse } from 'next/server';

const researchQueueStore = [
  {
    id: 'RSQ-101',
    serviceSlug: 'hajj-pre-registration',
    suggestedTitle: 'হজ প্রি-রেজিস্ট্রেশন ও পাসপোর্ট ভেরিফিকেশন',
    sourceUrl: 'https://hajj.gov.bd',
    status: 'IN_REVIEW',
    submittedAt: new Date().toISOString(),
    notes: 'পাসপোর্ট নাম্বার ও এনআইডি দিয়ে প্রাথমিক হজ নিবন্ধন এবং ট্র্যাকিং নম্বর জেনারেশন।'
  },
  {
    id: 'RSQ-102',
    serviceSlug: 'indian-visa-ivac',
    suggestedTitle: 'আইভ্যাক (IVAC) ইন্ডিয়ান ট্যুরিস্ট ভিসা অনলাইন আবেদন',
    sourceUrl: 'https://indianvisaonline.gov.in',
    status: 'PENDING_RESEARCH',
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
    notes: 'ভিসা ফর্ম পূরণ, ছবি সাইজিং এবং স্লট বুকিং গাইডলাইন।'
  }
];

export async function GET() {
  return NextResponse.json(researchQueueStore);
}
