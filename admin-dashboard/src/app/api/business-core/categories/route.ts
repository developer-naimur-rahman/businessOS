import { NextResponse } from 'next/server'
import { STATIC_CATALOG } from '../../../../config/static-catalog'

export async function GET() {
  const categoriesMap = new Map()
  STATIC_CATALOG.forEach(item => {
    if (item.category && !categoriesMap.has(item.category.id)) {
      categoriesMap.set(item.category.id, item.category)
    }
  })

  return NextResponse.json(Array.from(categoriesMap.values()))
}
