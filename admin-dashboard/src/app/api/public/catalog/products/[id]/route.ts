import { NextResponse } from 'next/server';
import { STATIC_CATALOG } from '../../../../../../config/static-catalog';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const item = STATIC_CATALOG.find(i => i.id === params.id || i.code.toLowerCase() === params.id.toLowerCase());

  if (!item) {
    return NextResponse.json({ message: 'Product or service not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...item,
    rating: 5.0,
    reviewCount: 12,
    variants: item.variants || [
      {
        id: `var-${item.id}`,
        sku: item.code,
        retailPrice: item.sellingPrice,
        status: 'ACTIVE'
      }
    ]
  });
}
