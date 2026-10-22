import { NextResponse } from 'next/server';
import { getValidBackendUrl } from '../../../../../../lib/utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const backendUrl = getValidBackendUrl();
  const authHeader = req.headers.get('authorization') || '';

  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/business-core/customers/${id}/ledger`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(1000),
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback
    }
  }

  return NextResponse.json({
    customer: { id, name: 'Customer' },
    summary: { totalSales: 5000, totalPaid: 5000, totalDue: 0 },
    transactions: []
  });
}
