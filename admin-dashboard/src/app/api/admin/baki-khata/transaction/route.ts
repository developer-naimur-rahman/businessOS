import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  return NextResponse.json({
    success: true,
    transactionId: `tx-${Date.now()}`,
    message: body.type === 'REPAYMENT' ? 'বাকি আদায় সফলভাবে রেকর্ড করা হয়েছে।' : 'নতুন বাকি সফলভাবে যুক্ত হয়েছে।'
  }, { status: 201 });
}
