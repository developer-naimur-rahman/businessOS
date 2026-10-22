import { NextResponse } from 'next/server';
import { STATIC_CATALOG } from '../../../../../config/static-catalog';

export async function GET() {
  const items = STATIC_CATALOG.filter(i => i.type === 'SERVICE');
  return NextResponse.json({
    items,
    meta: {
      total: items.length,
      page: 1,
      pageSize: 50,
      totalPages: 1
    }
  });
}
