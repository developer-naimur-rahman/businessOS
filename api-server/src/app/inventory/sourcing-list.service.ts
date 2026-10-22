import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface CreateWantedProductDto {
  requestedProductName: string;
  customerPhone?: string;
  customerName?: string;
  requestCount?: number;
  estimatedBuyPrice?: number;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  preferredSupplierOrMarket?: string;
  notes?: string;
}

@Injectable()
export class SourcingListService {
  private readonly logger = new Logger(SourcingListService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createWantedItem(organizationId: string, userId: string | null, dto: CreateWantedProductDto) {
    const wantedId = `WNT-${Date.now().toString().slice(-6)}`;

    const record = {
      wantedId,
      requestedProductName: dto.requestedProductName,
      customerName: dto.customerName || 'Walk-in Customer',
      customerPhone: dto.customerPhone || '',
      requestCount: Number(dto.requestCount) || 1,
      estimatedBuyPrice: Number(dto.estimatedBuyPrice) || 0,
      priority: dto.priority || 'HIGH',
      preferredSupplierOrMarket: dto.preferredSupplierOrMarket || 'Local Wholesale Market',
      notes: dto.notes || '',
      status: 'PENDING_SOURCING',
      createdAt: new Date().toISOString(),
    };

    const log = await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'WantedProduct',
        entityId: wantedId,
        action: 'ADD_WANTED_PRODUCT',
        newData: record,
      },
    });

    return {
      success: true,
      id: log.id,
      wantedId,
      record,
    };
  }

  async getWantedItems(organizationId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'WantedProduct',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return logs.map((l) => ({
      id: l.id,
      ...(l.newData as any),
      createdAt: l.createdAt.toISOString(),
    }));
  }

  async fulfillWantedItem(organizationId: string, id: string) {
    const log = await this.prisma.auditLog.findFirst({
      where: {
        organizationId,
        entityType: 'WantedProduct',
        OR: [{ id }, { entityId: id }],
      },
    });

    if (!log) {
      throw new NotFoundException('Wanted product item not found');
    }

    const current = (log.newData as any) || {};
    const updated = {
      ...current,
      status: 'FULFILLED_IN_STOCK',
      fulfilledAt: new Date().toISOString(),
    };

    await this.prisma.auditLog.update({
      where: { id: log.id },
      data: {
        action: 'FULFILL_WANTED_PRODUCT',
        newData: updated,
      },
    });

    return { success: true, message: 'Item marked as in stock', item: updated };
  }

  async getAutoBazaarSheet(organizationId: string) {
    // 1. Fetch products & variants
    const products = await this.prisma.product.findMany({
      where: { organizationId, isActive: true },
      include: {
        variants: true,
      },
      take: 50,
    });

    // 2. Fetch wanted items that are pending
    const wantedLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'WantedProduct',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const pendingWanted = wantedLogs
      .map((l) => ({ id: l.id, ...(l.newData as any) }))
      .filter((w) => w.status === 'PENDING_SOURCING');

    // Combine low stock & wanted items
    const bazaarItems: any[] = [];
    let totalEstimatedCost = 0;

    // A. Add low stock inventory items (simulated realistic stock checking)
    products.forEach((p, idx) => {
      // Pick first 5-8 items as needing bazaar purchase
      if (idx % 4 === 0 || p.isDropship) {
        const v = p.variants?.[0];
        const costPrice = Number(p.costPrice || v?.costPrice || 500);
        const suggestedQty = 10;
        const subtotal = costPrice * suggestedQty;
        totalEstimatedCost += subtotal;

        bazaarItems.push({
          sourceType: 'LOW_STOCK_REPLENISH',
          productName: p.name,
          sku: v?.sku || p.code || 'SKU-BAZ',
          currentStock: Math.floor(Math.random() * 4), // 0 to 3
          suggestedBuyQty: suggestedQty,
          unitCostBdt: costPrice,
          estimatedCostBdt: subtotal,
          marketOrSupplier: p.supplierName || 'Elephant Road / Stadium Market',
          urgency: 'HIGH',
        });
      }
    });

    // B. Add Customer Wanted items
    pendingWanted.forEach((w) => {
      const estCost = Number(w.estimatedBuyPrice) || 850;
      const qty = Number(w.requestCount) || 2;
      const subtotal = estCost * qty;
      totalEstimatedCost += subtotal;

      bazaarItems.push({
        sourceType: 'CUSTOMER_WANTED_BOOK',
        productName: w.requestedProductName,
        sku: w.wantedId || 'WNT-REQ',
        currentStock: 0,
        suggestedBuyQty: qty,
        unitCostBdt: estCost,
        estimatedCostBdt: subtotal,
        marketOrSupplier: w.preferredSupplierOrMarket || 'Local Wholesale Market',
        urgency: w.priority || 'HIGH',
        customerPhone: w.customerPhone,
      });
    });

    // Group items by market/supplier
    const groupedByMarket: Record<string, any[]> = {};
    bazaarItems.forEach((item) => {
      const m = item.marketOrSupplier || 'General Wholesale Bazaar';
      if (!groupedByMarket[m]) {
        groupedByMarket[m] = [];
      }
      groupedByMarket[m].push(item);
    });

    return {
      totalItemsCount: bazaarItems.length,
      totalEstimatedBazaarCostBdt: totalEstimatedCost,
      marketsCount: Object.keys(groupedByMarket).length,
      groupedByMarket,
      items: bazaarItems,
      wantedPendingCount: pendingWanted.length,
    };
  }
}
