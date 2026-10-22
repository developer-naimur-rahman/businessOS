import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      success: true,
      message: 'রিসার্চ প্রস্তাব সফলভাবে জমা হয়েছে',
      proposal: {
        id: `RSQ-${Date.now().toString().slice(-4)}`,
        serviceSlug: body.serviceSlug || 'custom-research',
        sourceUrl: body.sourceUrl || '',
        notes: body.notes || '',
        status: 'PENDING_RESEARCH',
        createdAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Failed' }, { status: 400 });
  }
}
