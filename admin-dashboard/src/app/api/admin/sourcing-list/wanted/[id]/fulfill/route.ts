import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return NextResponse.json({
      success: true,
      message: `Wanted item #${id} marked as procured & fulfilled`,
      fulfilledAt: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Failed' }, { status: 400 });
  }
}
