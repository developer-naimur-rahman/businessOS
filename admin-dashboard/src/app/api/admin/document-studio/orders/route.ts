import { NextResponse } from 'next/server';
import { demoStore } from '../../../../../lib/demo-backend-store';
import { getValidBackendUrl } from '../../../../../lib/utils';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get('category') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const search = url.searchParams.get('search') || undefined;
  const authHeader = req.headers.get('authorization') || '';

  const backendUrl = getValidBackendUrl();
  if (backendUrl && authHeader) {
    try {
      const res = await fetch(`${backendUrl}/api/admin/document-studio/orders?${url.searchParams.toString()}`, {
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

  const data = demoStore.getDocumentOrders(category, status, search);
  return NextResponse.json(data);
}
