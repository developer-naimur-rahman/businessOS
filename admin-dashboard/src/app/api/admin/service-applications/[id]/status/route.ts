import { NextResponse } from 'next/server';
import { demoStore } from '../../../../../../lib/demo-backend-store';
import { getValidBackendUrl } from '../../../../../../lib/utils';

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
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
      const res = await fetch(`${backendUrl}/api/admin/service-applications/${params.id}/status`, {
        method: 'PATCH',
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

  const updated = demoStore.updateApplicationStatus(
    params.id,
    body.status,
    body.notes,
    body.assignedStaffName
  );

  if (!updated) {
    return NextResponse.json({ message: 'Application not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}
