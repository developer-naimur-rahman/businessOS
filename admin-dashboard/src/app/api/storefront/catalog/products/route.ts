import { NextResponse } from 'next/server'
import { STATIC_CATALOG } from '../../../../../config/static-catalog'

export async function GET() {
  const products = STATIC_CATALOG.filter(i => i.type === 'PRODUCT')
  return NextResponse.json({
    items: products,
    meta: {
      total: products.length,
      page: 1,
      pageSize: 50,
      totalPages: 1
    }
  })
}
