import { NextResponse } from 'next/server'
import { STATIC_CATALOG } from '../../../../config/static-catalog'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const authHeader = req.headers.get('authorization')
  const orgHeader = req.headers.get('x-organization-id')

  // Attempt backend proxy if auth is available
  if (authHeader) {
    try {
      const backendUrl = `http://127.0.0.1:3333/api/business-core/products?${searchParams.toString()}`
      const backendRes = await fetch(backendUrl, {
        headers: {
          'Authorization': authHeader,
          ...(orgHeader ? { 'x-organization-id': orgHeader } : {}),
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      })

      if (backendRes.ok) {
        const data = await backendRes.json()
        const rawItems = Array.isArray(data) ? data : (data.items || [])
        // Ensure every backend item has at least one active variant
        const enrichedItems = rawItems.map((p: any) => {
          const activeVars = (p.variants || []).filter((v: any) => v.status === 'ACTIVE' || !v.status)
          return {
            ...p,
            variants: activeVars.length > 0 ? p.variants : [
              {
                id: p.id,
                sku: p.code || p.sku || `SKU-${p.id.slice(0, 8)}`,
                retailPrice: Number(p.sellingPrice || 0),
                posPrice: Number(p.sellingPrice || 0),
                status: 'ACTIVE',
                attributes: []
              }
            ]
          }
        })

        if (Array.isArray(data)) {
          return NextResponse.json(enrichedItems)
        }
        return NextResponse.json({ ...data, items: enrichedItems })
      }
    } catch {
      // Backend request failed, fallback to STATIC_CATALOG below
    }
  }

  const type = searchParams.get('type')
  const search = searchParams.get('search')?.toLowerCase() || ''

  let items = STATIC_CATALOG
  if (type) {
    items = items.filter(i => i.type === type.toUpperCase())
  }
  if (search) {
    items = items.filter(i => i.name.toLowerCase().includes(search) || i.code.toLowerCase().includes(search))
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

