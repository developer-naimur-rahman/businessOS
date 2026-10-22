import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newWanted = {
      id: `WNT-${Date.now().toString().slice(-4)}`,
      wantedId: `WNT-${Date.now().toString().slice(-4)}`,
      requestedProductName: body.requestedProductName,
      customerName: body.customerName || 'Walk-in Customer',
      customerPhone: body.customerPhone || '',
      requestCount: Number(body.requestCount || 1),
      estimatedBuyPrice: Number(body.estimatedBuyPrice || 0),
      priority: body.priority || 'MEDIUM',
      preferredSupplierOrMarket: body.preferredSupplierOrMarket || 'Elephant Road Computer City',
      notes: body.notes || '',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    return NextResponse.json(newWanted, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Failed to save wanted item' }, { status: 400 });
  }
}
