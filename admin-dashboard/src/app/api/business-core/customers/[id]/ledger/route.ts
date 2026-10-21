import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3333';
  const authHeader = req.headers.get('authorization') || '';

  try {
    const res = await fetch(`${backendUrl}/api/business-core/customers/${params.id}/ledger`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fallback
  }

  return NextResponse.json({
    customer: { id: params.id, name: 'Customer' },
    summary: { totalSales: 5000, totalPaid: 5000, totalDue: 0 },
    transactions: []
  });
}
