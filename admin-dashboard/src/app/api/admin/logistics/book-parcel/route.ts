import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prefix = body.courierProvider === 'STEADFAST' ? 'SF' : 'PT';
    const trackingCode = `${prefix}-${Math.floor(10000000 + Math.random() * 90000000)}`;

    return NextResponse.json({
      success: true,
      message: `Parcel booked successfully with ${body.courierProvider}. Tracking: ${trackingCode}`,
      consignment: {
        id: `CN-${Date.now().toString().slice(-4)}`,
        consignmentId: trackingCode,
        courierProvider: body.courierProvider,
        recipientName: body.recipientName,
        recipientPhone: body.recipientPhone,
        codAmount: body.codAmount,
        status: 'BOOKED_PENDING_PICKUP',
        bookedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Booking failed' }, { status: 400 });
  }
}
