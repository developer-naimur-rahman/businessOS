import { NextResponse } from 'next/server';
import { demoStore } from '../../../../../lib/demo-backend-store';

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  demoStore.deleteHeldCart(params.id);
  return NextResponse.json({ success: true });
}
