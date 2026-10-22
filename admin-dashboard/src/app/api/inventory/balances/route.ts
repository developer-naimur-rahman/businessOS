import { NextResponse } from 'next/server';
import { STATIC_CATALOG } from '../../../../config/static-catalog';

export async function GET() {
  const products = STATIC_CATALOG.filter(i => i.type === 'PRODUCT');
  const balances = products.map((p, idx) => ({
    id: `bal-${p.id}`,
    productId: p.id,
    productName: p.name,
    sku: p.code,
    warehouseName: 'Main Storefront Inventory',
    quantity: idx === 0 ? 3 : 25 + idx * 5, // make first item low stock for demo alerts
    costPrice: p.sellingPrice * 0.75,
    sellingPrice: p.sellingPrice,
    reorderLevel: 5
  }));

  return NextResponse.json(balances);
}
