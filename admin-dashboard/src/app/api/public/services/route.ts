import { NextResponse } from 'next/server';
import { DEFAULT_INTERNET_SERVICES } from '../../../../config/internet-services';
import { getValidBackendUrl } from '../../../../lib/utils';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search')?.toLowerCase().trim();

  // Try backend if available
  const backendUrl = getValidBackendUrl();
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/public/services?${searchParams.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(1000),
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback below
    }
  }

  let list = DEFAULT_INTERNET_SERVICES;
  if (category && category !== 'ALL') {
    list = list.filter(s => s.category === category);
  }
  if (search) {
    list = list.filter(s => 
      s.titleBn?.toLowerCase().includes(search) ||
      s.titleEn?.toLowerCase().includes(search) ||
      s.descriptionBn?.toLowerCase().includes(search)
    );
  }

  return NextResponse.json(list);
}
