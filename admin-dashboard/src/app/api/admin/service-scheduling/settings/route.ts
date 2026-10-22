import { NextResponse } from 'next/server';
import { demoStore } from '../../../../../lib/demo-backend-store';
import { getValidBackendUrl } from '../../../../../lib/utils';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const backendUrl = getValidBackendUrl();

  if (backendUrl && authHeader) {
    try {
      const res = await fetch(`${backendUrl}/api/admin/service-scheduling/settings`, {
        headers: { 'Authorization': authHeader },
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

  const settings = demoStore.getSchedulingSettings();
  return NextResponse.json(settings);
}

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
      const res = await fetch(`${backendUrl}/api/admin/service-scheduling/settings`, {
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

  const updated = demoStore.saveSchedulingSettings(body);
  return NextResponse.json(updated);
}
