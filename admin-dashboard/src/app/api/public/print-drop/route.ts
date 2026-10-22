import { NextResponse } from 'next/server';
import { demoStore } from '../../../../lib/demo-backend-store';

export async function POST(req: Request) {
  const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
  }

  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/public/print-drop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const printItem = demoStore.submitPrintDrop(body);

  return NextResponse.json({
    success: true,
    tokenNumber: printItem.tokenNumber,
    estimatedPriceBdt: printItem.estimatedPriceBdt,
    message: `ফাইল সফলভাবে কিউতে জমা হয়েছে! টোকেন নম্বর: #${printItem.tokenNumber}`
  }, { status: 201 });
}
