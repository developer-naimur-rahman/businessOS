import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    return NextResponse.json({
      success: true,
      message: `Machine #${id} maintenance log recorded successfully`,
      maintenanceRecord: {
        machineId: id,
        maintenanceType: body.maintenanceType,
        newTotalPagesCount: body.newTotalPagesCount,
        costBdt: body.costBdt,
        technician: body.technician,
        notes: body.notes,
        loggedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Failed to log maintenance' }, { status: 400 });
  }
}
