import { NextResponse } from 'next/server';

export async function GET() {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const dayBefore = new Date(Date.now() - 172800000).toISOString().split('T')[0];

  return NextResponse.json([
    {
      id: 'cr-hist-1',
      date: yesterday,
      openingFloat: 5000,
      totalSales: 8400,
      actualCountedCash: 12200,
      discrepancy: 0,
      status: 'BALANCED',
      closedBy: 'Naimur (Manager)'
    },
    {
      id: 'cr-hist-2',
      date: dayBefore,
      openingFloat: 5000,
      totalSales: 9200,
      actualCountedCash: 13150,
      discrepancy: -50,
      status: 'SHORTAGE',
      closedBy: 'Staff Member'
    }
  ]);
}
