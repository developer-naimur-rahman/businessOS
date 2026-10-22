import { NextResponse } from 'next/server';
import { demoStore } from '../../../../lib/demo-backend-store';
import { getValidBackendUrl } from '../../../../lib/utils';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;
  const authHeader = req.headers.get('authorization') || '';

  const backendUrl = getValidBackendUrl();
  if (backendUrl && authHeader) {
    try {
      const res = await fetch(`${backendUrl}/api/admin/service-jobs?${searchParams.toString()}`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(1000),
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback to local demo store
    }
  }

  const jobs = demoStore.getServiceJobs(status, search);
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j: any) => ['RECEIVED', 'IN_PROGRESS', 'WAITING_FOR_PARTS', 'PENDING'].includes(j.status)).length;
  const readyForDelivery = jobs.filter((j: any) => j.status === 'READY_FOR_DELIVERY').length;
  const totalDuePendingBdt = jobs.reduce((acc: number, j: any) => acc + (j.status !== 'DELIVERED_PAID' ? Math.max(0, Number(j.estimatedCostBdt || 0) - Number(j.advancePaidBdt || 0)) : 0), 0);

  return NextResponse.json({
    metrics: {
      totalJobs,
      activeJobs,
      readyForDelivery,
      totalDuePendingBdt,
    },
    jobs,
  });
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }

  const backendUrl = getValidBackendUrl();
  if (backendUrl && authHeader) {
    try {
      const res = await fetch(`${backendUrl}/api/admin/service-jobs`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback
    }
  }

  const newJob = demoStore.createServiceJob(body);
  return NextResponse.json(newJob, { status: 201 });
}
