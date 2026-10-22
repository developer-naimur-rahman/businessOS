import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    {
      id: 'br-main',
      name: 'Main Storefront & Digital Center',
      code: 'BR-01',
      address: 'Dhaka, Bangladesh',
      phone: '01712345678',
      isActive: true,
      isMain: true
    },
    {
      id: 'br-branch-2',
      name: 'Uttara IT & Printing Studio',
      code: 'BR-02',
      address: 'Sector 7, Uttara, Dhaka',
      phone: '01812345678',
      isActive: true,
      isMain: false
    }
  ]);
}
