import { NextResponse } from 'next/server';
import { getValidBackendUrl } from '../../../../lib/utils';

const STATIC_USERS = [
  {
    id: '212523fb-f200-47f0-b3e2-7c1f8ca7b62f',
    email: 'naimur582582@gmail.com',
    firstName: 'Naimur',
    lastName: 'Rahman',
    isActive: true,
    userRoles: [{ role: { name: 'Admin', description: 'Super administrator' } }],
    createdAt: new Date().toISOString()
  },
  {
    id: '567ac770-fdde-4df0-96ca-f31fdcb42ebf',
    email: 'admin@demo.local',
    firstName: 'Admin',
    lastName: 'Demo',
    isActive: true,
    userRoles: [{ role: { name: 'Admin', description: 'Super administrator' } }],
    createdAt: new Date().toISOString()
  },
  {
    id: '4d92b872-be5d-4168-9521-287cc6e10170',
    email: 'humayun@prismex.com',
    firstName: 'Humayun',
    lastName: 'Kabir',
    isActive: true,
    userRoles: [{ role: { name: 'Manager', description: 'Store operations manager' } }],
    createdAt: new Date().toISOString()
  },
  {
    id: 'b0f66631-74e9-4ce1-8996-75292daad36b',
    email: 'manager@demo.local',
    firstName: 'Manager',
    lastName: 'Demo',
    isActive: true,
    userRoles: [{ role: { name: 'Manager', description: 'Store operations manager' } }],
    createdAt: new Date().toISOString()
  },
  {
    id: '42c73cd0-bd2c-4c75-9acc-b6fb4c1f158a',
    email: 'staff@demo.local',
    firstName: 'Staff',
    lastName: 'Demo',
    isActive: true,
    userRoles: [{ role: { name: 'Staff', description: 'General floor staff' } }],
    createdAt: new Date().toISOString()
  },
  {
    id: 'cef6e64d-3200-499d-a840-648fcc132403',
    email: 'sales@demo.local',
    firstName: 'Sales',
    lastName: 'Demo',
    isActive: true,
    userRoles: [{ role: { name: 'Sales', description: 'POS Counter & Cashier' } }],
    createdAt: new Date().toISOString()
  },
  {
    id: '719192ff-67d2-41b7-824f-fc0d10f29c37',
    email: 'inventory@demo.local',
    firstName: 'Inventory',
    lastName: 'Demo',
    isActive: true,
    userRoles: [{ role: { name: 'Inventory', description: 'Stock keeper' } }],
    createdAt: new Date().toISOString()
  }
];

export async function GET(req: Request) {
  const backendUrl = getValidBackendUrl();
  const authHeader = req.headers.get('authorization') || '';

  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/iam/users`, {
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

  return NextResponse.json(STATIC_USERS);
}

export async function POST(req: Request) {
  const backendUrl = getValidBackendUrl();
  const authHeader = req.headers.get('authorization') || '';
  const body = await req.json();

  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/iam/users`, {
        method: 'POST',
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

  const created = {
    id: `usr-${Date.now()}`,
    ...body,
    isActive: true,
    userRoles: [{ role: { name: body.role || 'Staff' } }],
    createdAt: new Date().toISOString()
  };
  return NextResponse.json(created, { status: 201 });
}
