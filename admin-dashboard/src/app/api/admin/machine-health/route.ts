import { NextResponse } from 'next/server';

let machinesStore = [
  {
    id: 'EQ-01',
    machineName: 'Epson EcoTank L8050 Photo Printer',
    modelNumber: 'SN-EPS-L8050-9941',
    machineType: 'COLOR_INKJET_PRINTER',
    healthStatus: 'OPTIMAL',
    totalPrintedPagesOrHours: 4230,
    pagesSinceService: 680,
    maintenanceThresholdPages: 3000,
    inkLevels: {
      black: 85,
      cyan: 62,
      magenta: 78,
      yellow: 54
    },
    lastMaintenanceDate: '2026-10-15',
    lastMaintenanceNotes: 'Waste ink pad reset and print head deep cleaning completed.'
  },
  {
    id: 'EQ-02',
    machineName: 'Canon imageRUNNER ADVANCE 4525 Heavy Duty Copier',
    modelNumber: 'SN-IR-4525-4122',
    machineType: 'MONO_LASER_PRINTER',
    healthStatus: 'OPTIMAL',
    totalPrintedPagesOrHours: 48950,
    pagesSinceService: 2450,
    maintenanceThresholdPages: 5000,
    inkLevels: {
      black: 72,
      cyan: 0,
      magenta: 0,
      yellow: 0
    },
    lastMaintenanceDate: '2026-10-02',
    lastMaintenanceNotes: 'Toner bottle replaced with OEM Canon NPG-73.'
  },
  {
    id: 'EQ-03',
    machineName: 'Brother DCP-T720DW Duplex Color Unit',
    modelNumber: 'SN-BRT-T720-3011',
    machineType: 'COLOR_INKJET_PRINTER',
    healthStatus: 'REFILL_SOON',
    totalPrintedPagesOrHours: 12480,
    pagesSinceService: 1980,
    maintenanceThresholdPages: 2500,
    inkLevels: {
      black: 18,
      cyan: 45,
      magenta: 60,
      yellow: 22
    },
    lastMaintenanceDate: '2026-09-20',
    lastMaintenanceNotes: 'Paper feed roller cleaned.'
  },
  {
    id: 'EQ-04',
    machineName: 'Heavy Duty Thermal PVC & A3 Lamination Unit',
    modelNumber: 'SN-LAM-A3-PRO-881',
    machineType: 'LAMINATION_MACHINE',
    healthStatus: 'OPTIMAL',
    totalPrintedPagesOrHours: 3200,
    pagesSinceService: 450,
    maintenanceThresholdPages: 2000,
    inkLevels: null,
    lastMaintenanceDate: '2026-10-10',
    lastMaintenanceNotes: 'Silicon roller degreased & temperature calibration verified.'
  }
];

export async function GET() {
  const totalMachinesCount = machinesStore.length;
  const healthyCount = machinesStore.filter(m => m.healthStatus === 'OPTIMAL').length;
  const needRefillCount = machinesStore.filter(m => m.healthStatus === 'REFILL_SOON').length;
  const needMaintenanceCount = machinesStore.filter(m => m.healthStatus === 'MAINTENANCE_DUE').length;

  return NextResponse.json({
    metrics: {
      totalMachinesCount,
      healthyCount,
      needRefillCount,
      needMaintenanceCount
    },
    equipment: machinesStore
  });
}
