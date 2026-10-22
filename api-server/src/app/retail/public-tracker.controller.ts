import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('public/track')
export class PublicTrackerController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async trackOrderOrJob(@Query('query') rawQuery: string) {
    if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
      throw new BadRequestException('Please provide an Invoice Number, Job Ticket, S/N, or Phone Number to track.');
    }

    const query = rawQuery.trim();
    const queryLower = query.toLowerCase();

    // 1. Check ServiceJobTicket (AuditLog)
    const jobLogs = await this.prisma.auditLog.findMany({
      where: { entityType: 'ServiceJobTicket' },
      take: 100,
      orderBy: { createdAt: 'desc' }
    });

    const matchedJob = jobLogs.find(l => {
      const data = (l.newData as any) || {};
      return (
        data.jobNumber?.toLowerCase() === queryLower ||
        data.customerPhone?.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, '')) ||
        data.customerName?.toLowerCase().includes(queryLower)
      );
    });

    if (matchedJob) {
      const job = (matchedJob.newData as any) || {};
      const statusMap: Record<string, { label: string; step: number; color: string }> = {
        RECEIVED: { label: 'Job Received', step: 1, color: 'blue' },
        IN_PROGRESS: { label: 'In Progress / Servicing', step: 2, color: 'amber' },
        WAITING_FOR_PARTS: { label: 'Waiting for Parts', step: 2, color: 'amber' },
        READY_FOR_DELIVERY: { label: 'Ready for Pickup / Delivery', step: 3, color: 'emerald' },
        DELIVERED: { label: 'Delivered & Completed', step: 4, color: 'slate' }
      };

      const currentStatusInfo = statusMap[job.status] || { label: job.status || 'Received', step: 1, color: 'blue' };

      return {
        found: true,
        type: 'SERVICE_JOB',
        referenceNumber: job.jobNumber,
        title: `${job.serviceCategory?.replace(/_/g, ' ') || 'Service'} — ${job.jobDescription || 'Computer / Print Job'}`,
        deviceOrFile: job.deviceOrFileDetails || null,
        customerName: job.customerName ? job.customerName.slice(0, 3) + '***' : 'Customer',
        customerPhone: job.customerPhone ? job.customerPhone.slice(0, 5) + '******' : null,
        status: job.status,
        statusLabel: currentStatusInfo.label,
        currentStep: currentStatusInfo.step,
        steps: [
          { index: 1, name: 'Received', completed: currentStatusInfo.step >= 1 },
          { index: 2, name: 'In Servicing / Printing', completed: currentStatusInfo.step >= 2 },
          { index: 3, name: 'Ready for Collection', completed: currentStatusInfo.step >= 3 },
          { index: 4, name: 'Handed Over', completed: currentStatusInfo.step >= 4 }
        ],
        financials: {
          totalBdt: Number(job.estimatedCostBdt || 0),
          advancePaidBdt: Number(job.advancePaidBdt || 0),
          dueAmountBdt: Number(job.dueAmountBdt || 0),
          isFullyPaid: Number(job.dueAmountBdt || 0) <= 0
        },
        dates: {
          receivedAt: job.createdAt || matchedJob.createdAt,
          promisedDelivery: job.promisedDeliveryDate || null
        },
        assignedStaff: job.assignedStaffName || 'Service Technician',
        pickupNote: 'Please bring your printed claim token or show this screen at the shop desk.'
      };
    }

    // 2. Check PrintQueueDrop (AuditLog)
    const printLogs = await this.prisma.auditLog.findMany({
      where: { entityType: 'PrintQueueDrop' },
      take: 100,
      orderBy: { createdAt: 'desc' }
    });

    const matchedPrint = printLogs.find(l => {
      const data = (l.newData as any) || {};
      return (
        data.tokenNumber?.toLowerCase() === queryLower ||
        data.customerPhone?.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, ''))
      );
    });

    if (matchedPrint) {
      const print = (matchedPrint.newData as any) || {};
      const printStatusMap: Record<string, { label: string; step: number }> = {
        WAITING_IN_QUEUE: { label: 'In Print Queue', step: 1 },
        PRINTING_NOW: { label: 'Printing on Machine', step: 2 },
        PRINTED_READY: { label: 'Ready for Desk Pickup', step: 3 },
        BILLED_COMPLETED: { label: 'Collected & Paid', step: 4 }
      };

      const info = printStatusMap[print.status] || { label: 'Queued', step: 1 };

      return {
        found: true,
        type: 'PRINT_DROP',
        referenceNumber: print.tokenNumber,
        title: `Print File: ${print.fileName} (${print.paperSize || 'A4'} ${print.colorMode === 'FULL_COLOR' ? 'Color' : 'B&W'})`,
        customerName: print.customerName ? print.customerName.slice(0, 3) + '***' : 'Customer',
        customerPhone: print.customerPhone ? print.customerPhone.slice(0, 5) + '******' : null,
        status: print.status,
        statusLabel: info.label,
        currentStep: info.step,
        steps: [
          { index: 1, name: 'File Dropped', completed: info.step >= 1 },
          { index: 2, name: 'Printing', completed: info.step >= 2 },
          { index: 3, name: 'Ready at Counter', completed: info.step >= 3 },
          { index: 4, name: 'Collected', completed: info.step >= 4 }
        ],
        financials: {
          totalBdt: Number(print.finalCostBdt || print.estimatedPriceBdt || 0),
          advancePaidBdt: 0,
          dueAmountBdt: Number(print.finalCostBdt || print.estimatedPriceBdt || 0),
          isFullyPaid: print.status === 'BILLED_COMPLETED'
        },
        dates: {
          receivedAt: print.submittedAt || matchedPrint.createdAt
        },
        pickupNote: `Show Token #${print.tokenNumber} to the print desk operator.`
      };
    }

    // 3. Check Sale (POS & Store orders)
    const sale = await this.prisma.sale.findFirst({
      where: {
        OR: [
          { saleNumber: { equals: query, mode: 'insensitive' } },
          { id: query },
          { customer: { phone: { contains: query } } }
        ]
      },
      include: {
        customer: true,
        lines: {
          include: {
            variant: {
              include: { product: true }
            }
          }
        },
        payments: true
      }
    });

    if (sale) {
      const isCompleted = sale.status === 'COMPLETED';
      return {
        found: true,
        type: 'STORE_SALE',
        referenceNumber: sale.saleNumber,
        title: `Order / Invoice #${sale.saleNumber} (${sale.lines?.length || 1} items)`,
        customerName: (sale as any).customer?.name ? (sale as any).customer.name.slice(0, 3) + '***' : 'Customer',
        customerPhone: (sale as any).customer?.phone ? (sale as any).customer.phone.slice(0, 5) + '******' : null,
        status: sale.status,
        statusLabel: isCompleted ? 'Completed / Paid' : 'Draft / Processing',
        currentStep: isCompleted ? 4 : 2,
        steps: [
          { index: 1, name: 'Order Placed', completed: true },
          { index: 2, name: 'Billed / Packed', completed: true },
          { index: 3, name: 'Handover Ready', completed: isCompleted },
          { index: 4, name: 'Completed', completed: isCompleted }
        ],
        financials: {
          totalBdt: Number(sale.total || 0),
          advancePaidBdt: isCompleted ? Number(sale.total || 0) : 0,
          dueAmountBdt: isCompleted ? 0 : Number(sale.total || 0),
          isFullyPaid: isCompleted
        },
        items: sale.lines?.map((line: any) => ({
          name: line.productNameSnapshot || line.variant?.product?.name || 'Item',
          quantity: line.quantity,
          unitPrice: Number(line.unitPrice || 0)
        })),
        dates: {
          receivedAt: sale.createdAt
        },
        pickupNote: 'Verified store purchase invoice.'
      };
    }

    // 4. Check WarrantyRegistration (AuditLog)
    const warrantyLogs = await this.prisma.auditLog.findMany({
      where: { entityType: 'WarrantyRegistration' },
      take: 100,
      orderBy: { createdAt: 'desc' }
    });

    const matchedWarranty = warrantyLogs.find(l => {
      const data = (l.newData as any) || {};
      return (
        data.serialNumber?.toLowerCase() === queryLower ||
        data.customerPhone?.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, ''))
      );
    });

    if (matchedWarranty) {
      const w = (matchedWarranty.newData as any) || {};
      const soldDate = new Date(w.soldDate || matchedWarranty.createdAt);
      const durationDays = Number(w.warrantyDurationDays || 365);
      const expiryDate = new Date(soldDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      const now = new Date();
      const isUnderWarranty = now <= expiryDate;
      const daysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        found: true,
        type: 'WARRANTY_RECORD',
        referenceNumber: w.serialNumber,
        title: `Hardware Warranty: ${w.productName || 'Product'} (S/N: ${w.serialNumber})`,
        customerName: w.customerName ? w.customerName.slice(0, 3) + '***' : 'Customer',
        customerPhone: w.customerPhone ? w.customerPhone.slice(0, 5) + '******' : null,
        status: isUnderWarranty ? 'ACTIVE_WARRANTY' : 'EXPIRED',
        statusLabel: isUnderWarranty ? `Active Warranty (${daysRemaining} Days Left)` : 'Warranty Expired',
        currentStep: isUnderWarranty ? 3 : 4,
        steps: [
          { index: 1, name: 'Device Sold & Registered', completed: true },
          { index: 2, name: 'Active Hardware Coverage', completed: true },
          { index: 3, name: isUnderWarranty ? 'Warranty Active' : 'Expired', completed: isUnderWarranty },
          { index: 4, name: 'Replacement / Servicing Desk', completed: false }
        ],
        warrantyDetails: {
          isUnderWarranty,
          daysRemaining,
          soldDate: soldDate.toISOString(),
          expiryDate: expiryDate.toISOString(),
          supplier: w.supplierName || 'Official Distributor'
        },
        financials: {
          totalBdt: 0,
          advancePaidBdt: 0,
          dueAmountBdt: 0,
          isFullyPaid: true
        },
        pickupNote: 'Present this S/N at our service desk for official warranty claims.'
      };
    }

    return {
      found: false,
      query,
      message: `No active order, service ticket, print drop, or warranty found matching '${query}'. Please verify your ticket number or phone.`
    };
  }
}
