import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface RegisterEquipmentDto {
  machineName: string;
  modelNumber: string;
  machineType?: 'COLOR_INKJET_PRINTER' | 'LASER_PHOTOCOPIER' | 'PVC_CARD_PRINTER' | 'LARGE_FORMAT_BANNER_PLOTTER' | 'LAMINATING_MACHINE' | 'STUDIO_PC' | 'OTHER';
  totalPrintedPagesOrHours?: number;
  maintenanceThresholdPages?: number;
  inkLevelBlack?: number;
  inkLevelCyan?: number;
  inkLevelMagenta?: number;
  inkLevelYellow?: number;
  installedDate?: string;
  notes?: string;
}

export interface LogMaintenanceDto {
  maintenanceType: 'INK_TONER_REFILL' | 'HEAD_CLEANING' | 'DRUM_ROLLER_REPLACEMENT' | 'GENERAL_SERVICE';
  newTotalPagesCount?: number;
  costBdt?: number;
  inkLevels?: {
    black?: number;
    cyan?: number;
    magenta?: number;
    yellow?: number;
  };
  technicianName?: string;
  notes?: string;
}

@Injectable()
export class MachineHealthService {
  constructor(private readonly prisma: PrismaService) {}

  async registerEquipment(organizationId: string, userId: string | null, dto: RegisterEquipmentDto) {
    if (!dto.machineName || !dto.modelNumber) {
      throw new BadRequestException('Machine name and model number are required.');
    }

    const machineId = `EQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalPages = Number(dto.totalPrintedPagesOrHours || 0);
    const threshold = Number(dto.maintenanceThresholdPages || 3000);

    const payload = {
      machineId,
      machineName: dto.machineName.trim(),
      modelNumber: dto.modelNumber.trim(),
      machineType: dto.machineType || 'COLOR_INKJET_PRINTER',
      totalPrintedPagesOrHours: totalPages,
      lastMaintenancePageCount: totalPages,
      maintenanceThresholdPages: threshold,
      inkLevels: {
        black: dto.inkLevelBlack !== undefined ? Number(dto.inkLevelBlack) : 85,
        cyan: dto.inkLevelCyan !== undefined ? Number(dto.inkLevelCyan) : 75,
        magenta: dto.inkLevelMagenta !== undefined ? Number(dto.inkLevelMagenta) : 70,
        yellow: dto.inkLevelYellow !== undefined ? Number(dto.inkLevelYellow) : 90
      },
      healthStatus: 'OPTIMAL',
      installedDate: dto.installedDate || new Date().toISOString().split('T')[0],
      notes: dto.notes || '',
      maintenanceHistory: []
    };

    const record = await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        action: 'REGISTER_STUDIO_EQUIPMENT',
        entityType: 'StudioEquipment',
        entityId: machineId,
        oldData: undefined,
        newData: payload as any
      }
    });

    return {
      success: true,
      id: record.id,
      machineId,
      machineName: dto.machineName,
      message: `Equipment ${dto.machineName} registered successfully.`
    };
  }

  async getEquipmentList(organizationId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'StudioEquipment'
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    if (logs.length === 0) {
      const defaults: RegisterEquipmentDto[] = [
        {
          machineName: 'Epson EcoTank L8050 Photo Printer',
          modelNumber: 'L8050-6C-PHOTO',
          machineType: 'COLOR_INKJET_PRINTER',
          totalPrintedPagesOrHours: 2450,
          maintenanceThresholdPages: 3500,
          inkLevelBlack: 60,
          inkLevelCyan: 45,
          inkLevelMagenta: 25,
          inkLevelYellow: 80,
          notes: 'Studio Main 6-Color Passport & 4R Photo Printer'
        },
        {
          machineName: 'Canon imageRUNNER 2625i Photocopier',
          modelNumber: 'iR-2625i-HEAVY',
          machineType: 'LASER_PHOTOCOPIER',
          totalPrintedPagesOrHours: 18450,
          maintenanceThresholdPages: 20000,
          inkLevelBlack: 70,
          notes: 'High Speed Duplex Legal/A4 Document Copier'
        },
        {
          machineName: 'Zebra ZC300 PVC ID Card Printer',
          modelNumber: 'ZC300-DUAL',
          machineType: 'PVC_CARD_PRINTER',
          totalPrintedPagesOrHours: 620,
          maintenanceThresholdPages: 1000,
          inkLevelBlack: 85,
          notes: 'Student, Employee & NID PVC Card Printer'
        }
      ];

      for (const d of defaults) {
        await this.registerEquipment(organizationId, null, d);
      }

      return this.getEquipmentList(organizationId);
    }

    const items = logs.map(l => {
      const data = (l.newData as any) || {};
      const pagesSinceService = (data.totalPrintedPagesOrHours || 0) - (data.lastMaintenancePageCount || 0);
      const threshold = data.maintenanceThresholdPages || 3000;
      
      let healthStatus = 'OPTIMAL';
      const minInk = Math.min(...Object.values(data.inkLevels || { black: 100 }) as number[]);

      if (pagesSinceService >= threshold) {
        healthStatus = 'MAINTENANCE_DUE';
      } else if (minInk <= 20) {
        healthStatus = 'REFILL_SOON';
      }

      return {
        id: l.id,
        ...data,
        pagesSinceService,
        healthStatus
      };
    });

    const needRefillCount = items.filter(i => i.healthStatus === 'REFILL_SOON').length;
    const needMaintenanceCount = items.filter(i => i.healthStatus === 'MAINTENANCE_DUE').length;

    return {
      metrics: {
        totalMachinesCount: items.length,
        needRefillCount,
        needMaintenanceCount,
        healthyCount: items.length - needRefillCount - needMaintenanceCount
      },
      equipment: items
    };
  }

  async logMaintenance(organizationId: string, userId: string | null, id: string, dto: LogMaintenanceDto) {
    const log = await this.prisma.auditLog.findFirst({
      where: { id, organizationId, entityType: 'StudioEquipment' }
    });

    if (!log) throw new NotFoundException('Equipment not found.');

    const current = (log.newData as any) || {};
    const newPageCount = dto.newTotalPagesCount !== undefined ? Number(dto.newTotalPagesCount) : current.totalPrintedPagesOrHours;

    const maintenanceEntry = {
      type: dto.maintenanceType,
      date: new Date().toISOString(),
      pageCountAtService: newPageCount,
      costBdt: Number(dto.costBdt || 0),
      technicianName: dto.technicianName || 'In-House Operator',
      notes: dto.notes || ''
    };

    const updatedInkLevels = {
      ...current.inkLevels,
      ...(dto.inkLevels || {})
    };

    if (dto.maintenanceType === 'INK_TONER_REFILL') {
      if (!dto.inkLevels) {
        updatedInkLevels.black = 100;
        updatedInkLevels.cyan = 100;
        updatedInkLevels.magenta = 100;
        updatedInkLevels.yellow = 100;
      }
    }

    const updated = {
      ...current,
      totalPrintedPagesOrHours: newPageCount,
      lastMaintenancePageCount: newPageCount,
      inkLevels: updatedInkLevels,
      maintenanceHistory: [maintenanceEntry, ...(current.maintenanceHistory || [])]
    };

    await this.prisma.auditLog.update({
      where: { id },
      data: {
        action: `MAINTENANCE_${dto.maintenanceType}`,
        newData: updated as any
      }
    });

    return {
      success: true,
      message: `Maintenance ${dto.maintenanceType} recorded for ${current.machineName}. Cycle counter reset.`,
      updated
    };
  }
}
