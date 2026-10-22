import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    {
      id: 'rev-1',
      customerName: 'MD. Fahim Hossain',
      rating: 5,
      comment: 'টেলিটক সরকারি চাকরির আবেদন ও ছবি সাইজিং খুব দ্রুত ও নির্ভুলভাবে করে দিয়েছেন। সার্ভিস চার্জও রিজনেবল।',
      serviceName: 'সরকারি ও টেলিটক চাকরির আবেদন',
      createdAt: '2026-10-20T14:30:00Z',
      status: 'PUBLISHED'
    },
    {
      id: 'rev-2',
      customerName: 'Karim Rahman',
      rating: 5,
      comment: 'ডেস্কটপ মাদারবোর্ড শট সার্কিট ফিক্স করেছেন মাত্র ১ দিনে। চমৎকার কাজের অভিজ্ঞতা।',
      serviceName: 'Hardware & Motherboard Servicing',
      createdAt: '2026-10-18T16:00:00Z',
      status: 'PUBLISHED'
    },
    {
      id: 'rev-3',
      customerName: 'Nusrat Jahan',
      rating: 5,
      comment: 'ই-পাসপোর্ট ফরম পূরণের নির্ভুল চালান হিসাব ও প্রিন্ট গাইডলাইনের জন্য অনেক ধন্যবাদ।',
      serviceName: 'ই-পাসপোর্ট নতুন আবেদন ও নবায়ন',
      createdAt: '2026-10-15T11:20:00Z',
      status: 'PUBLISHED'
    }
  ]);
}
