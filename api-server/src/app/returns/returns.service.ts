import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface CreateRmaDto {
  saleId?: string;
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  productSkuOrName: string;
  quantity: number;
  returnType: 'REFUND' | 'EXCHANGE' | 'STORE_CREDIT';
  reasonCode: 'SIZE_MISMATCH' | 'DEFECTIVE_DAMAGED' | 'WRONG_ITEM_SENT' | 'CHANGED_MIND' | 'COURIER_UNDELIVERED_RETURN';
  customerNotes?: string;
  refundAmount?: number;
}

export interface ProcessQcDto {
  qcStatus: 'PASSED_RESTOCK' | 'FAILED_DAMAGED_QUARANTINE' | 'RETURN_TO_DROPSHIP_SUPPLIER';
  resolutionAction: 'ISSUE_CASH_REFUND' | 'ISSUE_BKASH_REFUND' | 'DISPATCH_EXCHANGE_ITEM' | 'CREDITED_TO_LOYALTY_WALLET';
  inspectorNotes?: string;
  refundAmount?: number;
}

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createRma(organizationId: string, userId: string | null, dto: CreateRmaDto) {
    const rmaNumber = `RMA-${Date.now().toString().slice(-6)}`;

    const rmaRecord = {
      rmaNumber,
      saleId: dto.saleId || null,
      orderNumber: dto.orderNumber || (dto.saleId ? `ORD-${dto.saleId.slice(0, 6)}` : 'DIRECT-RMA'),
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      productSkuOrName: dto.productSkuOrName,
      quantity: Number(dto.quantity) || 1,
      returnType: dto.returnType,
      reasonCode: dto.reasonCode,
      customerNotes: dto.customerNotes || '',
      refundAmount: Number(dto.refundAmount) || 0,
      qcStatus: 'PENDING_INSPECTION',
      resolutionStatus: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'RmaTicket',
        entityId: rmaNumber,
        action: 'CREATE_RMA_TICKET',
        newData: rmaRecord,
      },
    });

    return {
      success: true,
      message: `Return request ${rmaNumber} created successfully`,
      rma: rmaRecord,
    };
  }

  async getRmaList(organizationId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'RmaTicket',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return logs.map((l) => {
      const data = (l.newData as any) || {};
      return {
        id: l.id,
        rmaNumber: l.entityId,
        ...data,
        createdAt: data.createdAt || l.createdAt.toISOString(),
      };
    });
  }

  async processQc(organizationId: string, userId: string | null, rmaNumber: string, dto: ProcessQcDto) {
    const existingLog = await this.prisma.auditLog.findFirst({
      where: {
        organizationId,
        entityType: 'RmaTicket',
        entityId: rmaNumber,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!existingLog) {
      throw new Error(`RMA Ticket #${rmaNumber} not found`);
    }

    const currentData = (existingLog.newData as any) || {};

    // 1. If QC passed, restock inventory if product variant found
    let restocked = false;
    if (dto.qcStatus === 'PASSED_RESTOCK') {
      try {
        const variant = await this.prisma.productVariant.findFirst({
          where: { organizationId },
        });
        const warehouse = await this.prisma.warehouse.findFirst({
          where: { organizationId },
        });

        if (variant && warehouse) {
          const qty = Number(currentData.quantity) || 1;
          await this.prisma.inventoryMovement.create({
            data: {
              organizationId,
              warehouseId: warehouse.id,
              variantId: variant.id,
              quantity: qty,
              type: 'ADJUSTMENT_IN' as any,
              referenceType: 'RMA_RESTOCK',
              referenceId: rmaNumber,
            },
          });
          restocked = true;
        }
      } catch (err: any) {
        this.logger.warn(`Auto-restock inventory movement error: ${err.message}`);
      }
    }

    const updatedData = {
      ...currentData,
      qcStatus: dto.qcStatus,
      resolutionAction: dto.resolutionAction,
      inspectorNotes: dto.inspectorNotes || '',
      refundAmount: dto.refundAmount !== undefined ? dto.refundAmount : currentData.refundAmount,
      resolutionStatus: 'RESOLVED',
      restocked,
      processedAt: new Date().toISOString(),
    };

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'RmaTicket',
        entityId: rmaNumber,
        action: 'PROCESS_RMA_QC',
        oldData: currentData,
        newData: updatedData,
      },
    });

    return {
      success: true,
      message: `RMA #${rmaNumber} inspected with status ${dto.qcStatus}. Resolution: ${dto.resolutionAction}.`,
      rma: updatedData,
    };
  }
}
