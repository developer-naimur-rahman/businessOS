import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3333';
  const authHeader = req.headers.get('authorization') || '';
  const body = await req.json().catch(() => ({}));

  try {
    const res = await fetch(`${backendUrl}/api/admin/products/analyze-profit`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fallback calculation in serverless
  }

  // Pure mathematical calculation fallback
  const sellingPrice = Number(body.sellingPrice) || 0;
  const supplierCost = Number(body.supplierCost) || 0;
  const estimatedShippingCost = Number(body.estimatedShippingCost) || 0;
  const gatewayFeePercentage = body.gatewayFeePercentage !== undefined ? Number(body.gatewayFeePercentage) : 1.5;

  const gatewayFeeRate = gatewayFeePercentage / 100;
  const totalSourcingCost = supplierCost + estimatedShippingCost;
  const gatewayFeeAmount = Number((sellingPrice * gatewayFeeRate).toFixed(2));
  const totalCost = Number((totalSourcingCost + gatewayFeeAmount).toFixed(2));
  const netProfit = Number((sellingPrice - totalCost).toFixed(2));
  const profitMargin = sellingPrice > 0 ? Number(((netProfit / sellingPrice) * 100).toFixed(2)) : 0;

  const breakEvenSellingPrice = gatewayFeeRate < 1 
    ? Number((totalSourcingCost / (1 - gatewayFeeRate)).toFixed(2))
    : totalSourcingCost;

  const targetMargin = 0.35;
  const recommendedSellingPrice = (1 - gatewayFeeRate - targetMargin) > 0
    ? Number((totalSourcingCost / (1 - gatewayFeeRate - targetMargin)).toFixed(2))
    : Number((totalSourcingCost * 1.5).toFixed(2));

  return NextResponse.json({
    sellingPrice,
    supplierCost,
    estimatedShippingCost,
    totalSourcingCost,
    gatewayFeePercentage,
    gatewayFeeAmount,
    totalCost,
    netProfit,
    profitMargin,
    breakEvenSellingPrice,
    breakEvenPrice: breakEvenSellingPrice,
    recommendedSellingPrice,
    recommendedPrice: recommendedSellingPrice,
    targetMarginPercentage: 35,
  });
}
