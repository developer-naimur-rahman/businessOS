import { NextResponse } from 'next/server';

const STATIC_ROLES = [
  {
    id: '48155571-c748-49e9-83fa-3c02bed703c6',
    name: 'Admin',
    description: 'Super administrator with full access',
    permissions: [{ permission: { action: '*' } }],
    createdAt: new Date().toISOString()
  },
  {
    id: 'dc011e4b-f64e-464b-9467-c074d7d0fa4e',
    name: 'Manager',
    description: 'Store operations manager',
    permissions: [
      { permission: { action: 'sales.manage' } },
      { permission: { action: 'inventory.manage' } },
      { permission: { action: 'catalog.manage' } },
      { permission: { action: 'businesscore.customers.manage' } },
      { permission: { action: 'iam.users.view' } },
      { permission: { action: 'iam.roles.view' } }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'a395cc80-5a28-4d34-8575-fbe1960fed96',
    name: 'Sales',
    description: 'Sales and POS Counter operations',
    permissions: [
      { permission: { action: 'sales.view' } },
      { permission: { action: 'sales.create' } },
      { permission: { action: 'catalog.view' } }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'd976a035-8371-4a84-ae6d-711b3e302ba6',
    name: 'Inventory',
    description: 'Inventory and stock adjustments',
    permissions: [
      { permission: { action: 'inventory.view' } },
      { permission: { action: 'inventory.adjust' } },
      { permission: { action: 'inventory.transfer' } }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'c859642b-9ab7-4760-a640-364f7ae18723',
    name: 'Staff',
    description: 'General store floor staff',
    permissions: [
      { permission: { action: 'sales.view' } },
      { permission: { action: 'sales.create' } },
      { permission: { action: 'catalog.view' } }
    ],
    createdAt: new Date().toISOString()
  }
];

export async function GET(req: Request) {
  const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3333';
  const authHeader = req.headers.get('authorization') || '';

  try {
    const res = await fetch(`${backendUrl}/api/iam/roles`, {
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

  return NextResponse.json(STATIC_ROLES);
}

export async function POST(req: Request) {
  const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3333';
  const authHeader = req.headers.get('authorization') || '';
  const body = await req.json();

  try {
    const res = await fetch(`${backendUrl}/api/iam/roles`, {
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
    // Fallback
  }

  const created = {
    id: `role-${Date.now()}`,
    ...body,
    permissions: (body.permissions || []).map((p: string) => ({ permission: { action: p } })),
    createdAt: new Date().toISOString()
  };
  return NextResponse.json(created, { status: 201 });
}
