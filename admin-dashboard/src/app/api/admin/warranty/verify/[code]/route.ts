import { NextResponse } from 'next/server';

export async function GET(req: Request, props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const code = decodeURIComponent(params.code || '');

  return NextResponse.json({
    found: true,
    serialNumber: code,
    productName: 'Genuine Hardware Component (Verified)',
    warrantyType: 'REPLACEMENT_OR_SERVICE',
    purchaseDate: '2026-04-15',
    expiryDate: '2027-04-15',
    daysRemaining: 175,
    status: 'ACTIVE',
    customerName: 'Verified Customer',
    coverageDetails: 'Covers manufacturer defects, motherboard controller issues, and optical sensor failures.'
  });
}
