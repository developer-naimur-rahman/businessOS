import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    totalRegisteredItems: 142,
    activeWarranties: 128,
    claimsProcessed: 14,
    recentClaims: [
      {
        id: 'w-1',
        serialNumber: 'SN-HP-5CD1234XYZ',
        productName: 'HP Pavilion 15 Display Panel',
        customerName: 'Salma Begum',
        warrantyPeriodMonths: 12,
        purchaseDate: '2026-05-10',
        expiryDate: '2027-05-10',
        status: 'ACTIVE'
      },
      {
        id: 'w-2',
        serialNumber: 'SN-LOG-MOU-9921',
        productName: 'Logitech B100 Optical Mouse',
        customerName: 'Karim Rahman',
        warrantyPeriodMonths: 36,
        purchaseDate: '2025-11-01',
        expiryDate: '2028-11-01',
        status: 'ACTIVE'
      }
    ]
  });
}
