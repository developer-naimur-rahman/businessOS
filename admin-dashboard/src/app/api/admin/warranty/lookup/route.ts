import { NextResponse } from 'next/server';
import { registeredWarrantyStore, WarrantyItem } from '../../../../../lib/warranty-store';

export async function GET() {
  const activeCount = registeredWarrantyStore.filter((i: WarrantyItem) => (i.daysRemaining || 0) > 0).length;
  const expiredCount = registeredWarrantyStore.filter((i: WarrantyItem) => (i.daysRemaining || 0) <= 0).length;

  return NextResponse.json({
    metrics: {
      totalRegistered: registeredWarrantyStore.length,
      activeUnderWarranty: activeCount,
      expiredWarranty: expiredCount,
      totalClaimsLogged: 1
    },
    items: registeredWarrantyStore,
    recentClaims: [
      {
        id: 'clm-1',
        serialNumber: 'SN-HP-5CD1234XYZ',
        productName: 'HP Pavilion 15 Display Panel',
        customerName: 'Salma Begum',
        customerPhone: '0171635679',
        issueReported: 'Vertical line on screen after 2 months',
        status: 'RMA_SENT_TO_VENDOR',
        createdAt: '2026-07-20T11:00:00Z'
      }
    ]
  });
}
