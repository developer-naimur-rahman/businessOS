import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newMachine = {
      id: `EQ-${Date.now().toString().slice(-4)}`,
      machineName: body.machineName || 'New Machine',
      modelNumber: body.modelNumber || 'SN-GENERIC-001',
      machineType: body.machineType || 'COLOR_INKJET_PRINTER',
      healthStatus: 'OPTIMAL',
      totalPrintedPagesOrHours: Number(body.totalPrintedPages || 0),
      pagesSinceService: 0,
      maintenanceThresholdPages: Number(body.threshold || 3000),
      inkLevels: {
        black: 100,
        cyan: 100,
        magenta: 100,
        yellow: 100
      },
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      lastMaintenanceNotes: body.notes || 'Newly commissioned unit.'
    };
    return NextResponse.json(newMachine, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Failed to add equipment' }, { status: 400 });
  }
}
