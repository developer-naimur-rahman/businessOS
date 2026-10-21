import { NextResponse } from 'next/server';

const STATIC_CUSTOMERS = [
  {
    id: '01fbf875-ad53-4b76-9649-5ed88c1fb043',
    name: 'Local High School',
    phone: '0171974862',
    email: 'customer10@demo.local',
    address: 'Local Area',
    customerType: 'BUSINESS',
    companyName: 'Local High School',
    due: 1450,
    totalSpent: 12500,
    orderCount: 8,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: '05ee789b-53f2-4586-9870-4d805adc9c27',
    name: 'Jamal Bhuiyan',
    phone: '0171635679',
    email: 'customer3@demo.local',
    address: 'Gulshan 2, Dhaka',
    customerType: 'INDIVIDUAL',
    companyName: '',
    due: 0,
    totalSpent: 8300,
    orderCount: 5,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: '09886940-3514-4621-8041-ee39502d09d4',
    name: 'XYZ Small Business',
    phone: '0171677894',
    email: 'customer13@demo.local',
    address: 'Motijheel C/A, Dhaka',
    customerType: 'BUSINESS',
    companyName: 'XYZ Small Business',
    due: 3200,
    totalSpent: 45000,
    orderCount: 14,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: 'cust-karim-004',
    name: 'Karim Rahman',
    phone: '01812345678',
    email: 'karim@prismex.local',
    address: 'Uttara Sector 7, Dhaka',
    customerType: 'INDIVIDUAL',
    due: 0,
    totalSpent: 5200,
    orderCount: 3,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  }
];

export async function GET(req: Request) {
  const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3333';
  const authHeader = req.headers.get('authorization') || '';

  try {
    const res = await fetch(`${backendUrl}/api/business-core/customers`, {
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
    // Backend offline / Vercel serverless fallback
  }

  return NextResponse.json(STATIC_CUSTOMERS);
}

export async function POST(req: Request) {
  const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3333';
  const authHeader = req.headers.get('authorization') || '';
  const body = await req.json();

  try {
    const res = await fetch(`${backendUrl}/api/business-core/customers`, {
      method: 'POST',
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
    // Backend offline / Vercel serverless fallback
  }

  const created = {
    id: `cust-${Date.now()}`,
    ...body,
    due: 0,
    totalSpent: 0,
    orderCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };
  return NextResponse.json(created, { status: 201 });
}
