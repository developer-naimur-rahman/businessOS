import { NextResponse } from 'next/server';
import { demoStore } from '../../../../../../lib/demo-backend-store';
import { getValidBackendUrl } from '../../../../../../lib/utils';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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
      const res = await fetch(`${backendUrl}/api/admin/service-applications/${params.id}/deliverables`, {
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

  const deliverable = demoStore.addApplicationDeliverable(params.id, body);
  return NextResponse.json(deliverable, { status: 201 });
}
