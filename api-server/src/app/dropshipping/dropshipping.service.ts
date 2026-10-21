import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { HybridIntelligenceService } from '../common/services/hybrid-intelligence.service';

export interface DropshipAnalyzeDto {
  productName: string;
  sourcePlatform: 'SKYBUY_CHINA' | 'RESELLING_BD' | 'ALIEXPRESS' | 'LOCAL_WHOLESALE';
  supplierUrl?: string;
  supplierPriceBdt: number;
  weightGrams?: number;
  targetSellingPrice: number;
  categoryHint?: string;
  estimatedAdSpendPerOrder?: number;
  codReturnRatePercent?: number;
  imageUrl?: string;
}

export interface DropshipImportDto {
  productName: string;
  sellingPrice: number;
  compareAtPrice?: number;
  supplierCost: number;
  estimatedShippingCost: number;
  supplierName: string;
  supplierUrl?: string;
  imageUrl?: string;
  description?: string;
  watchlistId?: string;
}

@Injectable()
export class DropshippingService {
  constructor(
    private prisma: PrismaService,
    private hybridAi: HybridIntelligenceService,
  ) {}

  async analyzeProduct(organizationId: string, userId: string, dto: DropshipAnalyzeDto) {
    if (!dto.productName || !dto.targetSellingPrice || dto.supplierPriceBdt === undefined) {
      throw new BadRequestException('Product name, supplier price and target selling price are required');
    }

    const analysisResult = await this.hybridAi.analyze(dto);

    // Save to Watchlist in AuditLog
    try {
      await this.prisma.auditLog.create({
        data: {
          organizationId,
          userId,
          entityType: 'DropshipResearch',
          entityId: analysisResult.id,
          action: 'DROPSHIP_RESEARCH_ANALYZED',
          newData: analysisResult as any,
        },
      });
    } catch (e) {
      console.error('Failed to log dropship research to auditLog', e);
    }

    return analysisResult;
  }

  async extractProductFromUrl(url: string, platformHint?: string) {
    if (!url) {
      throw new BadRequestException('Product URL is required');
    }
    return this.hybridAi.extractProductFromUrl(url, platformHint);
  }

  async copilotChat(organizationId: string, message: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [todaySales, pendingDropshipOrders, cashClosing] = await Promise.all([
      this.prisma.sale.findMany({
        where: { organizationId, saleDate: { gte: startOfDay } },
        select: { total: true },
      }),
      this.prisma.saleLine.count({
        where: {
          organizationId,
          fulfillmentStatus: { not: 'COMPLETED' },
          variant: { product: { isDropship: true } },
        },
      }),
      this.prisma.auditLog.findFirst({
        where: {
          organizationId,
          entityType: 'CashRegisterClosing',
          createdAt: { gte: startOfDay },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalSalesAmount = todaySales.reduce((acc, s) => acc + Number(s.total || 0), 0);
    const grossProfitEstimate = Math.round(totalSalesAmount * 0.38);

    const storeContext = {
      todaySales: totalSalesAmount,
      salesCount: todaySales.length,
      grossProfit: grossProfitEstimate,
      isRegisterClosed: !!cashClosing,
      expectedClosingBalance: cashClosing ? (cashClosing.newData as any)?.actualCountedCash : totalSalesAmount,
      pendingDropshipOrders,
    };

    return this.hybridAi.askCopilot(message, storeContext);
  }

  async getWatchlist(organizationId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'DropshipResearch',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return logs.map((log) => {
      const data: any = log.newData || {};
      return {
        id: log.id,
        researchId: log.entityId,
        productName: data.productName || 'Unnamed Idea',
        sourcePlatform: data.sourcePlatform || 'SKYBUY_CHINA',
        supplierPriceBdt: data.supplierPriceBdt || 0,
        targetSellingPrice: data.targetSellingPrice || 0,
        weightGrams: data.weightGrams || 0,
        imageUrl: data.imageUrl,
        engineUsed: data.engineUsed || 'ALGORITHMIC_FALLBACK',
        score: data.score || 0,
        verdict: data.verdict || 'Promising',
        verdictLevel: data.verdictLevel || 'PROMISING',
        totalLandedCost: data.costBreakdown?.totalLandedCost || 0,
        netProfit: data.profitability?.netProfit || 0,
        profitMargin: data.profitability?.profitMargin || 0,
        supplierUrl: data.supplierUrl || '',
        importStatus: data.importStatus || 'WATCHLIST',
        analyzedAt: log.createdAt,
        rawAnalysis: data,
      };
    });
  }

  async deleteWatchlist(organizationId: string, id: string) {
    await this.prisma.auditLog.deleteMany({
      where: {
        organizationId,
        id,
        entityType: 'DropshipResearch',
      },
    });
    return { success: true };
  }

  async importProduct(organizationId: string, userId: string, dto: DropshipImportDto) {
    const {
      productName,
      sellingPrice,
      compareAtPrice,
      supplierCost,
      estimatedShippingCost,
      supplierName,
      supplierUrl = '',
      imageUrl = '',
      description = '',
      watchlistId,
    } = dto;

    if (!productName || !sellingPrice) {
      throw new BadRequestException('Product title and selling price are required');
    }

    const code = 'DS-' + Date.now().toString().slice(-6);

    const product = await this.prisma.product.create({
      data: {
        organization: { connect: { id: organizationId } },
        name: productName.trim(),
        code,
        type: 'PRODUCT',
        sellingPrice: new Decimal(sellingPrice),
        costPrice: new Decimal(supplierCost || 0),
        compareAtPrice: compareAtPrice ? new Decimal(compareAtPrice) : new Decimal(Math.round(sellingPrice * 1.35)),
        isDropship: true,
        supplierName: supplierName || 'Skybuy / Global Sourcing',
        supplierUrl: supplierUrl || null,
        supplierCost: supplierCost ? new Decimal(supplierCost) : null,
        estimatedShippingCost: estimatedShippingCost ? new Decimal(estimatedShippingCost) : null,
        imageUrl: imageUrl || null,
        description: description || `Premium ${productName} with nationwide Cash on Delivery.`,
        isActive: true,
        isOnlineVisible: true,
        isPosVisible: true,
        status: 'ACTIVE',
        variants: {
          create: [
            {
              sku: 'SKU-' + code,
              retailPrice: new Decimal(sellingPrice),
              costPrice: new Decimal(supplierCost || 0),
              status: 'ACTIVE',
              trackingType: 'NONE',
            },
          ],
        },
      },
      include: {
        variants: true,
      },
    });

    // If imported from a watchlist item, mark it as IMPORTED in AuditLog
    if (watchlistId) {
      try {
        const item = await this.prisma.auditLog.findUnique({ where: { id: watchlistId } });
        if (item && item.newData) {
          const updated = { ...(item.newData as any), importStatus: 'IMPORTED', liveProductId: product.id };
          await this.prisma.auditLog.update({
            where: { id: watchlistId },
            data: { newData: updated },
          });
        }
      } catch (e) {
        console.error('Failed to update watchlist item import status', e);
      }
    }

    return {
      success: true,
      message: 'Product successfully imported to live storefront',
      product,
    };
  }

  async getDropshipOrders(organizationId: string) {
    const orders = await this.prisma.sale.findMany({
      where: {
        organizationId,
        lines: {
          some: {
            variant: {
              product: {
                isDropship: true,
              },
            },
          },
        },
      },
      include: {
        customer: true,
        branch: true,
        payments: true,
        lines: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return orders.map((order) => {
      const dropshipItems = order.lines
        .filter((l) => l.variant?.product?.isDropship)
        .map((l) => {
          const p = l.variant?.product;
          const unitCost = Number(p?.supplierCost || 0);
          const qty = Number(l.quantity);
          const totalCost = unitCost * qty;
          return {
            lineId: l.id,
            productName: l.productNameSnapshot || p?.name || 'Dropship Item',
            sku: l.skuSnapshot || l.variant?.sku,
            quantity: qty,
            unitPrice: Number(l.unitPrice),
            lineTotal: Number(l.lineTotal),
            supplierName: p?.supplierName || 'Skybuy / Supplier',
            supplierUrl: p?.supplierUrl || '',
            unitSupplierCost: unitCost,
            totalSupplierCost: totalCost,
            fulfillmentStatus: l.fulfillmentStatus || 'QUEUED',
          };
        });

      const totalDropshipSupplierCost = dropshipItems.reduce((acc, curr) => acc + curr.totalSupplierCost, 0);
      const orderTotal = Number(order.total);
      const estimatedProfit = orderTotal - totalDropshipSupplierCost;

      const customerName = order.customer?.name || 'Customer';
      const customerPhone = order.customer?.phone || 'No Phone';
      const customerAddress = order.customer?.address || 'Dhaka, Bangladesh';

      // Auto-generated Supplier Dispatch Sheet
      const dispatchNote = `
📦 DROPSHIP ORDER DISPATCH NOTE
Order ID: ${order.saleNumber || order.id.slice(0, 8)}
Date: ${new Date(order.createdAt).toLocaleDateString()}
---------------------------------
CUSTOMER SHIPPING INFO:
Recipient: ${customerName}
Phone: ${customerPhone}
Address: ${customerAddress}
---------------------------------
ITEMS TO FULFILL:
${dropshipItems.map((i) => `• ${i.productName} (Qty: ${i.quantity}) - ${i.supplierUrl || 'No Link'}`).join('\n')}
---------------------------------
COD Collect Amount: ৳${orderTotal.toLocaleString()}
      `.trim();

      return {
        id: order.id,
        saleNumber: order.saleNumber || 'ORD-' + order.id.slice(0, 8),
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: orderTotal,
        totalDropshipSupplierCost,
        estimatedProfit,
        createdAt: order.createdAt,
        customer: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
          email: order.customer?.email,
        },
        dropshipItems,
        dispatchNote,
      };
    });
  }

  async dispatchDropshipOrder(organizationId: string, saleId: string, supplierRef?: string, note?: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId, organizationId },
      include: { lines: true },
    });

    if (!sale) {
      throw new NotFoundException('Order not found');
    }

    // Update lines fulfillmentStatus to DISPATCHED
    await this.prisma.saleLine.updateMany({
      where: {
        saleId,
        organizationId,
      },
      data: {
        fulfillmentStatus: 'PROCESSING',
      },
    });

    // Record in audit log
    await this.prisma.auditLog.create({
      data: {
        organizationId,
        entityType: 'Sale',
        entityId: saleId,
        action: 'DROPSHIP_DISPATCHED_TO_SUPPLIER',
        newData: {
          supplierReference: supplierRef || 'N/A',
          note: note || 'Dispatched via Dropshipping Hub',
          dispatchedAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: 'Dropship order marked as dispatched to supplier',
    };
  }
}
