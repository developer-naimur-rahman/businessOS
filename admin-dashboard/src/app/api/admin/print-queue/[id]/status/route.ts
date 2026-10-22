import { NextResponse } from 'next/server';
import { demoStore } from '../../../../../../lib/demo-backend-store';

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const updated = demoStore.updatePrintStatus(params.id, body.status, body.finalCostBdt);
  if (!updated) {
    return NextResponse.json({ message: 'Print job not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}
