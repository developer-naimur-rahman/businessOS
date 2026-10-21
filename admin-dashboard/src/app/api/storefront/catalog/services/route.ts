import { NextResponse } from 'next/server'
import { STATIC_CATALOG } from '../../../../../config/static-catalog'

export async function GET() {
  const services = STATIC_CATALOG.filter(i => i.type === 'SERVICE')
  return NextResponse.json({
    items: services,
    meta: {
      total: services.length,
      page: 1,
      pageSize: 50,
      totalPages: 1
    }
  })
}
