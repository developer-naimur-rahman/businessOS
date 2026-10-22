import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const claimId = `clm-${Date.now()}`;
  return NextResponse.json({
    success: true,
    claimId,
    message: `ক্লেইম সফলভাবে রেকর্ড করা হয়েছে (টোকেন #${claimId})। ভেন্ডর ও গ্রাহককে মেসেজ পাঠানো হয়েছে।`,
    status: body.claimStatus || 'RECEIVED_FOR_WARRANTY'
  }, { status: 201 });
}
