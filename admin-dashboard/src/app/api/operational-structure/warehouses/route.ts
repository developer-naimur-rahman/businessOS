import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    {
      id: 'wh-main',
      name: 'Main Counter & Display Inventory',
      code: 'WH-01',
      branchId: 'br-main',
      isActive: true
    },
    {
      id: 'wh-store',
      name: 'Backroom Paper, Toner & Parts Storage',
      code: 'WH-02',
      branchId: 'br-main',
      isActive: true
    }
  ]);
}
