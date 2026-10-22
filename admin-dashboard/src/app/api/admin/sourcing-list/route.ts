import { NextResponse } from 'next/server';

let wantedItemsStore = [
  {
    id: 'WNT-01',
    wantedId: 'WNT-01',
    requestedProductName: 'DDR4 8GB 3200MHz Desktop RAM (Corsair / Kingston)',
    customerName: 'Rafiqul Islam',
    customerPhone: '01819234567',
    requestCount: 2,
    estimatedBuyPrice: 2150,
    priority: 'HIGH',
    preferredSupplierOrMarket: 'Elephant Road Computer City',
    notes: 'Customer deposit paid 500 BDT advance.',
    status: 'PENDING',
    createdAt: new Date().toISOString()
  },
  {
    id: 'WNT-02',
    wantedId: 'WNT-02',
    requestedProductName: 'Canon NPG-59 Original Copier Black Toner Bottle',
    customerName: 'Nilkhet Coaching Center',
    customerPhone: '01712349988',
    requestCount: 3,
    estimatedBuyPrice: 1650,
    priority: 'HIGH',
    preferredSupplierOrMarket: 'Motijheel / Stadium Market',
    notes: 'Urgent for coaching test exams printing.',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'WNT-03',
    wantedId: 'WNT-03',
    requestedProductName: 'Epson 003 Original 4-Color Ink Bottle Set (BK, C, M, Y)',
    customerName: 'Creative Printing & Studio',
    customerPhone: '01911223344',
    requestCount: 5,
    estimatedBuyPrice: 2800,
    priority: 'MEDIUM',
    preferredSupplierOrMarket: 'Elephant Road Computer City',
    notes: 'Bulk stock replenishment for photo studio printing.',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

export async function GET() {
  return NextResponse.json(wantedItemsStore);
}
