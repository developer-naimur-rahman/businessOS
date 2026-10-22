import { NextResponse } from 'next/server';
import { demoStore } from '../../../../../lib/demo-backend-store';
import { getValidBackendUrl } from '../../../../../lib/utils';

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON request body' }, { status: 400 });
  }

  const { eventType, customerId } = body || {};
  if (!eventType || !customerId) {
    return NextResponse.json({ message: 'eventType and customerId are required' }, { status: 400 });
  }

  const authHeader = req.headers.get('authorization') || '';
  const backendUrl = getValidBackendUrl();

  if (backendUrl && authHeader) {
    try {
      const res = await fetch(`${backendUrl}/api/admin/customer-vault/extension-event`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(2000),
        cache: 'no-store'
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch {
      // Fallback
    }
  }

  const result = demoStore.logExtensionEvent(body);
  return NextResponse.json(result);
}
