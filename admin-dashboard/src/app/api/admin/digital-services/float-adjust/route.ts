import { NextResponse } from 'next/server';
import { demoStore } from '../../../../../lib/demo-backend-store';
import { getValidBackendUrl } from '../../../../../lib/utils';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const backendUrl = getValidBackendUrl();
  if (backendUrl && authHeader) {
    try {
      const res = await fetch(`${backendUrl}/api/admin/digital-services/adjust-float`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback
    }
  }

  const result = demoStore.adjustDigitalFloat(
    body.wallet || body.serviceType || 'FLEXILOAD_SIM',
    body.adjustType || 'DEPOSIT_ADD',
    Number(body.amount || 0),
    body.reason || 'Manual Counter Adjustment'
  );
  return NextResponse.json(result);
}
