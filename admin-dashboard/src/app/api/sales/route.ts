import { NextResponse } from 'next/server';
import { demoStore } from '../../../lib/demo-backend-store';

export async function GET() {
  const sales = demoStore.store.salesHistory;
  return NextResponse.json(sales);
}
