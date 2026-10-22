import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface CreatePrintDropDto {
  customerName: string;
  customerPhone: string;
  fileName: string;
  fileUrlOrBase64?: string;
  paperSize?: 'A4' | 'LEGAL' | 'PHOTO_4R' | 'PHOTO_STAMP_PP' | 'PVC_ID_CARD' | 'BANNER_SQFT';
  colorMode?: 'BLACK_WHITE' | 'FULL_COLOR';
  copies?: number;
  pageRange?: string;
  bindingOrLamination?: 'NONE' | 'SPIRAL_BINDING' | 'LAMINATION';
  notes?: string;
}

@Injectable()
export class PrintQueueService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateEstimatedPrice(dto: CreatePrintDropDto): number {
    const copies = Math.max(1, Number(dto.copies || 1));
    const size = dto.paperSize || 'A4';
    const isColor = dto.colorMode === 'FULL_COLOR';

    let baseRatePerPage = 5;
    if (size === 'A4') {
      baseRatePerPage = isColor ? 20 : 5;
    } else if (size === 'LEGAL') {
      baseRatePerPage = isColor ? 25 : 8;
    } else if (size === 'PHOTO_4R') {
      baseRatePerPage = 30;
    } else if (size === 'PHOTO_STAMP_PP') {
      baseRatePerPage = 50;
    } else if (size === 'PVC_ID_CARD') {
      baseRatePerPage = 80;
    } else if (size === 'BANNER_SQFT') {
      baseRatePerPage = 35;
    }

    let extraCost = 0;
    if (dto.bindingOrLamination === 'SPIRAL_BINDING') {
      extraCost += 40;
    } else if (dto.bindingOrLamination === 'LAMINATION') {
      extraCost += 20 * copies;
    }

    return (baseRatePerPage * copies) + extraCost;
  }

  async submitPrintDrop(dto: CreatePrintDropDto, customOrgId?: string) {
    if (!dto.customerName || !dto.customerPhone) {
      throw new BadRequestException('Customer name and phone number are required.');
    }

    let organizationId = customOrgId;
    if (!organizationId) {
      const org = await this.prisma.organization.findFirst();
      if (!org) throw new NotFoundException('Organization not configured.');
      organizationId = org.id;
    }

    const tokenNumber = `PRT-${Math.floor(100 + Math.random() * 900)}`;
    const estimatedPriceBdt = this.calculateEstimatedPrice(dto);

    const payload = {
      tokenNumber,
      customerName: dto.customerName.trim(),
      customerPhone: dto.customerPhone.trim(),
      fileName: dto.fileName || 'Document.pdf',
      fileUrlOrBase64: dto.fileUrlOrBase64 || null,
      paperSize: dto.paperSize || 'A4',
      colorMode: dto.colorMode || 'BLACK_WHITE',
      copies: Number(dto.copies || 1),
      pageRange: dto.pageRange || 'All Pages',
      bindingOrLamination: dto.bindingOrLamination || 'NONE',
      notes: dto.notes || '',
      estimatedPriceBdt,
      status: 'WAITING_IN_QUEUE',
      submittedAt: new Date().toISOString()
    };

    const record = await this.prisma.auditLog.create({
      data: {
        organizationId,
        action: 'SUBMIT_PRINT_DROP',
        entityType: 'PrintQueueDrop',
        entityId: tokenNumber,
        oldData: undefined,
        newData: payload as any
      }
    });

    return {
      success: true,
      id: record.id,
      tokenNumber,
      estimatedPriceBdt,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      status: 'WAITING_IN_QUEUE',
      message: 'Print job submitted successfully. Please inform the shop desk.'
    };
  }

  async getPrintQueue(organizationId: string, status?: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'PrintQueueDrop'
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    const items = logs.map(l => {
      const state = (l.newData as any) || {};
      return {
        id: l.id,
        createdAt: l.createdAt,
        ...state
      };
    });

    if (status && status !== 'ALL') {
      return items.filter(item => item.status === status);
    }
    return items;
  }

  async updateStatus(organizationId: string, id: string, newStatus: string, finalCostBdt?: number) {
    const log = await this.prisma.auditLog.findFirst({
      where: { id, organizationId, entityType: 'PrintQueueDrop' }
    });

    if (!log) throw new NotFoundException('Print job not found.');

    const current = (log.newData as any) || {};
    const updated = {
      ...current,
      status: newStatus,
      finalCostBdt: finalCostBdt !== undefined ? Number(finalCostBdt) : current.estimatedPriceBdt,
      updatedAt: new Date().toISOString()
    };

    await this.prisma.auditLog.update({
      where: { id },
      data: {
        action: `UPDATE_PRINT_STATUS_${newStatus}`,
        newData: updated as any
      }
    });

    return { success: true, updated };
  }

  async getQrConfig(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId }
    });

    return {
      shopName: org?.name || 'BusinessOS Studio & Print House',
      publicUploadUrl: '/upload-print',
      rates: [
        { type: 'A4 Black & White', rateBdt: 5 },
        { type: 'A4 Full Color (Laser/Inkjet)', rateBdt: 20 },
        { type: 'Legal / Document Stamp', rateBdt: 8 },
        { type: 'Passport / Stamp Photo (PP)', rateBdt: 50 },
        { type: 'PVC ID Card Print', rateBdt: 80 },
        { type: 'Spiral Binding', rateBdt: 40 },
        { type: 'Lamination (A4)', rateBdt: 20 }
      ]
    };
  }
}
