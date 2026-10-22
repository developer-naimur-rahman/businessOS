import { NextResponse } from 'next/server';
import { demoStore } from '../../../../../lib/demo-backend-store';
import { getValidBackendUrl } from '../../../../../lib/utils';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const backendUrl = getValidBackendUrl();

  if (backendUrl && authHeader) {
    try {
      const res = await fetch(`${backendUrl}/api/admin/document-studio/templates`, {
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

  const templates = demoStore.getDocumentTemplates();
  return NextResponse.json(templates);
}
