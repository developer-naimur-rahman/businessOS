import { NextResponse } from 'next/server';
import { demoStore } from '../../../../lib/demo-backend-store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;
  const authHeader = req.headers.get('authorization') || '';

  const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
  if (backendUrl && authHeader) {
    try {
      const res = await fetch(`${backendUrl}/api/admin/service-applications?${searchParams.toString()}`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(1500),
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

  const apps = demoStore.getServiceApplications(status, search);
  return NextResponse.json(apps);
}
