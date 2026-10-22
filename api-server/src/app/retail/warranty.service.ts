import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface RegisterWarrantyDto {
  serialNumber: string;
  productName: string;
  sku?: string;
  customerName: string;
  customerPhone: string;
  saleId?: string;
  invoiceNumber?: string;
  supplierName?: string;
  soldDate?: string;
  warrantyDurationDays?: number;
  notes?: string;
}

export interface ClaimWarrantyDto {
  serialNumber: string;
  customerName?: string;
  customerPhone?: string;
  issueDescription: string;
  status: 'RECEIVED_FOR_WARRANTY' | 'SENT_TO_SUPPLIER' | 'REPLACED_OR_REPAIRED' | 'RETURNED_TO_CUSTOMER';
  supplierReference?: string;
  notes?: string;
}

@Injectable()
export class WarrantyService {
  private readonly logger = new Logger(WarrantyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registerWarranty(organizationId: string, userId: string | null, dto: RegisterWarrantyDto) {
    const soldDate = dto.soldDate ? new Date(dto.soldDate) : new Date();
    const durationDays = Number(dto.warrantyDurationDays) || 365;
    const expiryDate = new Date(soldDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const cleanSerial = dto.serialNumber.trim().toUpperCase();

    const warrantyRecord = {
      serialNumber: cleanSerial,
      productName: dto.productName,
      sku: dto.sku || 'N/A',
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      saleId: dto.saleId || null,
      invoiceNumber: dto.invoiceNumber || (dto.saleId ? `INV-${dto.saleId.slice(0, 6)}` : 'STORE-SALE'),
      supplierName: dto.supplierName || 'Primary Distributor',
      soldDate: soldDate.toISOString(),
      warrantyDurationDays: durationDays,
      expiryDate: expiryDate.toISOString(),
      notes: dto.notes || '',
      registeredAt: new Date().toISOString(),
    };

    const log = await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'WarrantyRegistration',
        entityId: cleanSerial,
        action: 'REGISTER_WARRANTY',
        newData: warrantyRecord,
      },
    });

    return {
      success: true,
      id: log.id,
      serialNumber: cleanSerial,
      expiryDate: expiryDate.toISOString(),
      warrantyRecord,
    };
  }

  async verifyWarranty(organizationId: string, query: string) {
    const q = query.trim().toUpperCase();

    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'WarrantyRegistration',
      },
      orderBy: { createdAt: 'desc' },
    });

    const match = logs.find((l) => {
      const d = (l.newData as any) || {};
      return (
        (d.serialNumber && d.serialNumber.toUpperCase() === q) ||
        (d.invoiceNumber && d.invoiceNumber.toUpperCase() === q) ||
        (d.customerPhone && d.customerPhone.includes(q))
      );
    });

    if (!match) {
      return {
        found: false,
        query,
        message: 'No warranty record found matching this Serial Number, IMEI, Invoice, or Phone.',
      };
    }

    const data = (match.newData as any) || {};
    const expiry = new Date(data.expiryDate);
    const now = new Date();
    const isUnderWarranty = expiry > now;
    const daysRemaining = isUnderWarranty ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24)) : 0;

    // Check claims history
    const claimLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'WarrantyClaim',
        entityId: data.serialNumber,
      },
      orderBy: { createdAt: 'desc' },
    });

    const claims = claimLogs.map((c) => ({
      id: c.id,
      date: c.createdAt.toISOString(),
      ...(c.newData as any),
    }));

    return {
      found: true,
      serialNumber: data.serialNumber,
      productName: data.productName,
      sku: data.sku,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      invoiceNumber: data.invoiceNumber,
      supplierName: data.supplierName,
      soldDate: data.soldDate,
      warrantyDurationDays: data.warrantyDurationDays,
      expiryDate: data.expiryDate,
      isUnderWarranty,
      daysRemaining,
      warrantyStatus: isUnderWarranty ? 'ACTIVE_WARRANTY' : 'WARRANTY_EXPIRED',
      claimsCount: claims.length,
      claimsHistory: claims,
    };
  }

  async listWarranties(organizationId: string, search?: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'WarrantyRegistration',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const now = new Date();
    let activeCount = 0;
    let expiredCount = 0;

    let items = logs.map((l) => {
      const d = (l.newData as any) || {};
      const expiry = new Date(d.expiryDate);
      const isUnderWarranty = expiry > now;
      const daysRemaining = isUnderWarranty ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24)) : 0;

      if (isUnderWarranty) activeCount++;
      else expiredCount++;

      return {
        id: l.id,
        ...d,
        isUnderWarranty,
        daysRemaining,
      };
    });

    if (search && search.trim()) {
      const q = search.trim().toUpperCase();
      items = items.filter(
        (i) =>
          (i.serialNumber && i.serialNumber.toUpperCase().includes(q)) ||
          (i.productName && i.productName.toUpperCase().includes(q)) ||
          (i.customerName && i.customerName.toUpperCase().includes(q)) ||
          (i.customerPhone && i.customerPhone.includes(q)) ||
          (i.invoiceNumber && i.invoiceNumber.toUpperCase().includes(q))
      );
    }

    const claimLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'WarrantyClaim',
      },
      take: 50,
    });

    return {
      metrics: {
        totalRegistered: items.length,
        activeUnderWarranty: activeCount,
        expiredWarranty: expiredCount,
        totalClaimsLogged: claimLogs.length,
      },
      items,
      recentClaims: claimLogs.map((c) => ({ id: c.id, date: c.createdAt.toISOString(), ...(c.newData as any) })),
    };
  }

  async logClaim(organizationId: string, userId: string | null, dto: ClaimWarrantyDto) {
    const cleanSerial = dto.serialNumber.trim().toUpperCase();
    const claimTicket = `CLM-${Date.now().toString().slice(-6)}`;

    const claimRecord = {
      claimTicket,
      serialNumber: cleanSerial,
      customerName: dto.customerName || 'Customer',
      customerPhone: dto.customerPhone || 'N/A',
      issueDescription: dto.issueDescription,
      status: dto.status,
      supplierReference: dto.supplierReference || '',
      notes: dto.notes || '',
      claimedAt: new Date().toISOString(),
    };

    const log = await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'WarrantyClaim',
        entityId: cleanSerial,
        action: `CLAIM_${dto.status}`,
        newData: claimRecord,
      },
    });

    return {
      success: true,
      claimTicket,
      id: log.id,
      claimRecord,
    };
  }
}
