import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    (globalThis as any).__pos_live_display_state = {
      ...body,
      receivedAt: Date.now()
    };
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

export async function GET() {
  const state = (globalThis as any).__pos_live_display_state || {
    items: [],
    subtotal: 0,
    discount: 0,
    grandTotal: 0,
    status: 'IDLE_PROMO'
  };
  return NextResponse.json(state);
}
