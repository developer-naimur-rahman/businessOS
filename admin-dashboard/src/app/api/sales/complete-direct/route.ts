import { NextResponse } from 'next/server';
import { demoStore } from '../../../../lib/demo-backend-store';

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }

  const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
  const authHeader = req.headers.get('authorization') || '';

  if (backendUrl && authHeader) {
    try {
      const res = await fetch(`${backendUrl}/api/sales/complete-direct`, {
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

  const sale = demoStore.completeSale(body);
  return NextResponse.json(sale, { status: 201 });
}
