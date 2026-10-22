import { NextResponse } from 'next/server';
import { demoStore } from '../../../../lib/demo-backend-store';

export async function GET() {
  const held = demoStore.getHeldCarts();
  return NextResponse.json(held);
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const created = demoStore.holdCart(body);
  return NextResponse.json(created, { status: 201 });
}
