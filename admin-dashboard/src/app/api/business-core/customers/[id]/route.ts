import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3333';
  const authHeader = req.headers.get('authorization') || '';

  try {
    const res = await fetch(`${backendUrl}/api/business-core/customers/${params.id}`, {
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
    id: params.id,
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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3333';
  const authHeader = req.headers.get('authorization') || '';
  const body = await req.json();

  try {
    const res = await fetch(`${backendUrl}/api/business-core/customers/${params.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fallback
  }

  return NextResponse.json({ id: params.id, ...body });
}
