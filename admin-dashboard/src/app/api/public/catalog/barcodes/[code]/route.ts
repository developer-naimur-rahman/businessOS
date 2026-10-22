import { NextResponse } from 'next/server';
import { STATIC_CATALOG } from '../../../../../../config/static-catalog';

export async function GET(
  req: Request,
  props: { params: Promise<{ code: string }> }
) {
  const params = await props.params;
  const code = decodeURIComponent(params.code || '').trim().toLowerCase();
  
  if (!code) {
    return NextResponse.json({ message: 'Barcode is required' }, { status: 400 });
  }

  const match = STATIC_CATALOG.find(p => 
    p.code?.toLowerCase() === code ||
    p.variants?.some(v => v.sku?.toLowerCase() === code) ||
    p.id.toLowerCase() === code
  );

  if (!match) {
    return NextResponse.json({ message: 'Product not found for barcode' }, { status: 404 });
  }

  return NextResponse.json(match);
}
