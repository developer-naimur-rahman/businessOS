import { NextResponse } from 'next/server';
import { demoStore } from '../../../../../../../../lib/demo-backend-store';
import { getValidBackendUrl } from '../../../../../../../../lib/utils';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id, docId } = await params;
  const authHeader = req.headers.get('authorization') || '';
  const backendUrl = getValidBackendUrl();

  if (backendUrl && authHeader) {
    try {
      const res = await fetch(`${backendUrl}/api/admin/customer-vault/${encodeURIComponent(id)}/documents/${encodeURIComponent(docId)}/access`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(2000),
        cache: 'no-store'
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch {
      // Fallback
    }
  }

  const result = demoStore.getDocumentAccess(id, docId);
  return NextResponse.json(result.body, { status: result.status });
}
