import { NextResponse } from 'next/server';
import { demoStore } from '../../../../../lib/demo-backend-store';

export async function GET() {
  const apps = demoStore.getServiceApplications();
  return NextResponse.json(apps);
}
