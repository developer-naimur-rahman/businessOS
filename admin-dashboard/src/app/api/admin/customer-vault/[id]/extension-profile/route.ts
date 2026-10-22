import { NextResponse } from 'next/server';
import { demoStore } from '../../../../../../lib/demo-backend-store';
import { getValidBackendUrl } from '../../../../../../lib/utils';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = req.headers.get('authorization') || '';
  const backendUrl = getValidBackendUrl();

  if (backendUrl && authHeader) {
    try {
      const res = await fetch(`${backendUrl}/api/admin/customer-vault/${encodeURIComponent(id)}/extension-profile`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(2000),
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
      if (res.status === 404) {
        return NextResponse.json({ message: `Customer profile not found for ID: ${id}` }, { status: 404 });
      }
    } catch {
      // Fallback to demo store
    }
  }

  const profile = demoStore.getCustomerVaultProfile(id);
  if (!profile) {
    return NextResponse.json({ message: `Customer profile not found for: ${id}` }, { status: 404 });
  }

  return NextResponse.json(profile);
}
