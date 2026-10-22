import { NextResponse } from 'next/server';
import { getValidBackendUrl } from '../../../../../lib/utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const backendUrl = getValidBackendUrl();
  const authHeader = req.headers.get('authorization') || '';

  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/business-core/customers/${id}`, {
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
    id,
    name: 'Demo Customer',
    email: 'customer@demo.local',
    phone: '01700000000',
    customerType: 'INDIVIDUAL',
    status: 'ACTIVE',
    due: 0,
    totalSpent: 12000,
    createdAt: new Date().toISOString()
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const backendUrl = getValidBackendUrl();
  const authHeader = req.headers.get('authorization') || '';
  const body = await req.json();

  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/business-core/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback
    }
  }

  return NextResponse.json({ id, ...body });
}
