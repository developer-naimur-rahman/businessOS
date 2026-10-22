import { NextResponse } from 'next/server';
import { demoStore } from '../../../../lib/demo-backend-store';
import { getValidBackendUrl } from '../../../../lib/utils';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '';

  if (!query.trim()) {
    return NextResponse.json({ message: 'Tracking reference or phone number is required.' }, { status: 400 });
  }

  const backendUrl = getValidBackendUrl();
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/public/track?${searchParams.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(2000),
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

  const result = demoStore.track(query);
  return NextResponse.json(result);
}
