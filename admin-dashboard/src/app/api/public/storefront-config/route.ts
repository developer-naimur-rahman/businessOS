import { NextResponse } from 'next/server';

export async function GET() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  return NextResponse.json({
    shopName: 'My Business OS',
    tagline: 'Smart Retail, Digital Studio & Customer Application Hub',
    phone: '01712345678',
    email: 'info@businessos.local',
    address: 'Dhaka, Bangladesh',
    flashSaleEnd: tomorrow.toISOString(),
    announcement: 'স্বাগতম BusinessOS-এ! অনলাইন সরকারি আবেদন, ফটো স্টুডিও, প্রিন্টিং ও আইটি সার্ভিসের নির্ভরযোগ্য প্রতিষ্ঠান।',
    bannerImages: [
      'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1531297172864-459c7accc8e5?q=80&w=800&auto=format&fit=crop'
    ]
  });
}
