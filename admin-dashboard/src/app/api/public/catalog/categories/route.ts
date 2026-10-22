import { NextResponse } from 'next/server';
import { STATIC_CATALOG } from '../../../../../config/static-catalog';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  let items = STATIC_CATALOG;
  if (type) {
    items = items.filter(i => i.type === type.toUpperCase());
  }

  // Extract unique categories
  const categoryMap = new Map();
  items.forEach(item => {
    if (item.category && !categoryMap.has(item.category.id)) {
      categoryMap.set(item.category.id, {
        id: item.category.id,
        name: item.category.name,
        slug: item.category.slug,
        type: item.type,
        productCount: items.filter(i => i.category?.id === item.category?.id).length
      });
    }
  });

  return NextResponse.json(Array.from(categoryMap.values()));
}
