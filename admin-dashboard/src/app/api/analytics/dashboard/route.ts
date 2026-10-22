import { NextResponse } from 'next/server';
import { demoStore } from '../../../../lib/demo-backend-store';
import { getValidBackendUrl } from '../../../../lib/utils';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get('days') || '30', 10);
  const authHeader = req.headers.get('authorization') || '';

  const backendUrl = getValidBackendUrl();
  if (backendUrl && authHeader) {
    try {
      const res = await fetch(`${backendUrl}/api/analytics/dashboard?days=${days}`, {
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

  const data = demoStore.getAnalyticsDashboard(days);
  return NextResponse.json(data);
}
