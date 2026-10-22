import { NextResponse } from 'next/server';
import { demoStore } from '../../../../lib/demo-backend-store';

export async function POST(req: Request) {
  const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON payload' }, { status: 400 });
  }

  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/public/service-request`, {
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
      // Backend offline, fallback below
    }
  }

  // Graceful local demo store handling
  const newApp = demoStore.submitServiceApplication(body);

  return NextResponse.json({
    success: true,
    referenceNumber: newApp.referenceNumber,
    status: newApp.status,
    application: newApp,
    message: `আবেদন সফলভাবে গ্রহণ করা হয়েছে! আপনার ট্র্যাকিং রেফারেন্স নম্বর: ${newApp.referenceNumber}`
  }, { status: 201 });
}
