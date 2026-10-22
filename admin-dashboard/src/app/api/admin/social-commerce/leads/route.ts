import { NextResponse } from 'next/server';

let socialLeadsStore = [
  {
    id: 'LEAD-101',
    customerName: 'Ashraful Huda',
    customerPhone: '01715498877',
    customerAddress: 'House 5, Road 2, Block A, Bashundhara R/A, Dhaka',
    platform: 'FACEBOOK_MESSENGER',
    detectedZone: 'INSIDE_DHAKA',
    productRequested: 'T800 Ultra Smartwatch Orange Strap',
    quantity: 1,
    unitPrice: 1250,
    deliveryCharge: 70,
    status: 'PARSED_HOT_LEAD',
    rawMessage: 'ভাই ১টা T800 অরেঞ্জ কালার ঘড়ি দেন। ঠিকানা বসুন্ধরা ব্লক এ রোড ২ বাসা ৫। নাম্বার ০১৭১৫৪৯৮৮৭৭। ক্যাশ অন ডেলিভারি পাঠায়েন।',
    receivedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'LEAD-102',
    customerName: 'Shampa Khatun',
    customerPhone: '01812998811',
    customerAddress: 'Kazir Dewri, Near Stadium Gate 2, Chittagong',
    platform: 'WHATSAPP_BUSINESS',
    detectedZone: 'OUTSIDE_DHAKA',
    productRequested: 'Epson 003 Ink 4 Pack Original',
    quantity: 2,
    unitPrice: 2800,
    deliveryCharge: 130,
    status: 'PARSED_HOT_LEAD',
    rawMessage: 'Epson L3210 এর কালি ২ সেট লাগবে। চিটাগং কাজীর দেউরি স্টেডিয়াম ২ নাম্বার গেট। ০১৮১২৯৯৮৮১১',
    receivedAt: new Date(Date.now() - 7200000).toISOString()
  }
];

export async function GET() {
  return NextResponse.json(socialLeadsStore);
}
