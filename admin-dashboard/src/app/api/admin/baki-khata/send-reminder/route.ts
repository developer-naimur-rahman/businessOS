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
    message: `বাকি আদায়ের তাগাদা এসএমএস পাঠানো হয়েছে (${body.phone || 'Customer'}).`
  });
}
