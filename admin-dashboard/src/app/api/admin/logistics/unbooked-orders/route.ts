import { NextResponse } from 'next/server';

const unbookedOrdersStore = [
  {
    saleId: 'ORD-2026-8801',
    saleNumber: 'INV-2026-8801',
    saleDate: new Date().toISOString(),
    customerName: 'Tanvir Ahmed',
    customerPhone: '01711223344',
    customerAddress: 'House 14, Road 5, Block B, Mirpur-10, Dhaka',
    cityZone: 'INSIDE_DHAKA',
    totalAmount: 1850,
    itemsCount: 2
  },
  {
    saleId: 'ORD-2026-8802',
    saleNumber: 'INV-2026-8802',
    saleDate: new Date(Date.now() - 7200000).toISOString(),
    customerName: 'Sultana Razia',
    customerPhone: '01822334455',
    customerAddress: 'Al-Madina Tower, 3rd Floor, GEC Circle, Chittagong',
    cityZone: 'OUTSIDE_DHAKA',
    totalAmount: 3200,
    itemsCount: 1
  },
  {
    saleId: 'ORD-2026-8803',
    saleNumber: 'INV-2026-8803',
    saleDate: new Date(Date.now() - 14400000).toISOString(),
    customerName: 'Mahmudul Hasan',
    customerPhone: '01933445566',
    customerAddress: 'Zilla School Road, Shibganj, Sylhet',
    cityZone: 'OUTSIDE_DHAKA',
    totalAmount: 1450,
    itemsCount: 3
  }
];

export async function GET() {
  return NextResponse.json(unbookedOrdersStore);
}
