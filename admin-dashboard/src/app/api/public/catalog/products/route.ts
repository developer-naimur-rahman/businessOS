import { NextResponse } from 'next/server'
import { STATIC_CATALOG } from '../../../../../config/static-catalog'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  let items = STATIC_CATALOG
  if (type) {
    items = items.filter(i => i.type === type.toUpperCase())
  }

  return NextResponse.json({
    items,
    meta: {
      total: items.length,
      page: 1,
      pageSize: 50,
      totalPages: 1
    }
  })
}
