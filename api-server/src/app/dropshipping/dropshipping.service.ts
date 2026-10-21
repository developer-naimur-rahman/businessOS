import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

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
  constructor(private prisma: PrismaService) {}

  async analyzeProduct(organizationId: string, userId: string, dto: DropshipAnalyzeDto) {
    const {
      productName,
      sourcePlatform,
      supplierUrl = '',
      supplierPriceBdt,
      weightGrams = 250,
      targetSellingPrice,
      categoryHint = 'General',
      estimatedAdSpendPerOrder = 200,
      codReturnRatePercent = 15,
      imageUrl = '',
    } = dto;

    if (!productName || !targetSellingPrice || supplierPriceBdt === undefined) {
      throw new BadRequestException('Product name, supplier price and target selling price are required');
    }

    // 1. Air Cargo / Freight & Sourcing fee calculation
    let shippingCost = 100; // Local delivery baseline
    let cargoFee = 0;
    let deliveryDaysText = '24–48 Hours across Bangladesh';

    if (sourcePlatform === 'SKYBUY_CHINA') {
      // Skybuy China air cargo ~850 BDT/kg, min 150 BDT
      cargoFee = Math.max(150, Math.round((weightGrams / 1000) * 850));
      shippingCost = cargoFee + 100; // Skybuy Air Cargo + Local Courier
      deliveryDaysText = '7–10 Business Days via Skybuy Air Cargo';
    } else if (sourcePlatform === 'ALIEXPRESS') {
      cargoFee = Math.max(250, Math.round((weightGrams / 1000) * 1100));
      shippingCost = cargoFee + 100;
      deliveryDaysText = '12–18 Days via AliExpress Standard Shipping';
    } else if (sourcePlatform === 'RESELLING_BD') {
      cargoFee = 60; // Local wholesale sorting & handling
      shippingCost = 100; // Standard BD courier
      deliveryDaysText = '24–48 Hours inside Dhaka / 72 Hours nationwide';
    } else {
      cargoFee = 40;
      shippingCost = 90;
      deliveryDaysText = '24–48 Hours across Bangladesh';
    }

    // 2. Unit economics
    const packagingCost = 35; // Bubble wrap, poly mailer, branded sticker
    const gatewayFee = Math.round(targetSellingPrice * 0.015); // 1.5% COD / digital gateway fee
    const adSpend = Math.max(50, Number(estimatedAdSpendPerOrder) || 200);

    // In Bangladesh, returned COD parcels incur 2-way courier charge (~130 BDT) + 50% wasted ad spend
    const returnRiskCost = Math.round(
      ((codReturnRatePercent / 100) * 130) + 
      (adSpend * (codReturnRatePercent / 100) * 0.5)
    );

    const totalLandedCost = supplierPriceBdt + shippingCost + packagingCost + gatewayFee + returnRiskCost + adSpend;
    const netProfit = targetSellingPrice - totalLandedCost;
    const profitMargin = targetSellingPrice > 0 ? Number(((netProfit / targetSellingPrice) * 100).toFixed(1)) : 0;

    // Break-even and Safe 35% margin price
    const fixedCostsExcludingGateway = supplierPriceBdt + shippingCost + packagingCost + returnRiskCost + adSpend;
    const breakEvenSellingPrice = Math.round(fixedCostsExcludingGateway / (1 - 0.015));
    const recommendedSellingPrice = Math.round(fixedCostsExcludingGateway / (1 - 0.015 - 0.35));

    const grossMarginAfterSourcing = targetSellingPrice - (supplierPriceBdt + shippingCost + packagingCost + gatewayFee + returnRiskCost);
    const breakEvenRoas = grossMarginAfterSourcing > 0 
      ? Number((targetSellingPrice / grossMarginAfterSourcing).toFixed(2)) 
      : 0;

    // 3. AI Viability Score (0-100)
    let score = 50;

    // Margin factor
    if (profitMargin >= 35) score += 25;
    else if (profitMargin >= 25) score += 18;
    else if (profitMargin >= 15) score += 8;
    else if (profitMargin < 10) score -= 20;

    // Net profit in BDT factor
    if (netProfit >= 600) score += 15;
    else if (netProfit >= 400) score += 10;
    else if (netProfit >= 250) score += 5;
    else if (netProfit < 100) score -= 15;

    // Weight penalty for air cargo
    if (sourcePlatform === 'SKYBUY_CHINA' || sourcePlatform === 'ALIEXPRESS') {
      if (weightGrams <= 250) score += 8;
      else if (weightGrams > 700) score -= 14;
    } else {
      score += 5; // Local sourcing speed bonus
    }

    // Bangladesh impulse buy sweet-spot (৳990 – ৳2,490)
    if (targetSellingPrice >= 950 && targetSellingPrice <= 2500) score += 8;
    else if (targetSellingPrice > 4000) score -= 6;

    // Clamp score
    score = Math.max(12, Math.min(98, Math.round(score)));

    // Verdict Badge
    let verdict = '❌ HIGH RISK / LOW MARGIN (Avoid)';
    let verdictLevel: 'WINNER' | 'PROMISING' | 'AVOID' = 'AVOID';
    if (score >= 80) {
      verdict = '🔥 WINNING PRODUCT (Scale Immediately)';
      verdictLevel = 'WINNER';
    } else if (score >= 55) {
      verdict = '⚡ PROMISING (Test with Small Budget)';
      verdictLevel = 'PROMISING';
    }

    // 4. Bangladesh Market & AI Insights
    const strengths: string[] = [];
    const risks: string[] = [];

    if (profitMargin >= 25) strengths.push(`Healthy net margin of ${profitMargin}% accommodates ad fluctuations.`);
    if (netProfit >= 350) strengths.push(`Attractive cash profit of ৳${netProfit.toLocaleString()} per delivered parcel.`);
    if (weightGrams <= 300) strengths.push(`Lightweight parcel (${weightGrams}g) minimizes air freight overhead.`);
    if (sourcePlatform === 'RESELLING_BD') strengths.push('Fast 24–48h local sourcing reduces customer cancellation rates.');

    if (profitMargin < 18) risks.push(`Tight net margin (${profitMargin}%). High risk if Facebook CPM spikes.`);
    if (weightGrams > 600 && sourcePlatform === 'SKYBUY_CHINA') risks.push(`Heavy weight (${weightGrams}g) adds ৳${cargoFee} to air freight.`);
    if (codReturnRatePercent > 18) risks.push(`High COD return rate (${codReturnRatePercent}%). Mandatory customer phone verification required.`);
    if (targetSellingPrice > 3500) risks.push('High price tag for impulse Facebook buyers. Offer partial advance payment to prevent return.');

    // 5. Auto-generated Storefront Copy & Ad Hooks
    const seoTitle = `${productName} — Premium Quality | Best Price in Bangladesh`;
    const description = `
<h3>${productName}</h3>
<p>Upgrade your day-to-day lifestyle with our premium <strong>${productName}</strong>. Sourced directly with high reliability and backed by full warranty inspection.</p>
<ul>
  <li><strong>Authentic Quality:</strong> Verified and tested before dispatch.</li>
  <li><strong>Safe Delivery:</strong> ${deliveryDaysText}.</li>
  <li><strong>Payment Flexibility:</strong> Cash on Delivery (COD) available nationwide.</li>
  <li><strong>Hassle-Free Replacement:</strong> 7-day checking guarantee.</li>
</ul>
<p><em>Order now to get instant discounted delivery anywhere in Bangladesh!</em></p>
    `.trim();

    const fbAdHookBangla = `🔥 সীমিত সময়ের স্পেশাল অফার! প্রিমিয়াম ${productName} এখন পাচ্ছেন বিশেষ ছাড়ে। সরাসরি ক্যাশ অন ডেলিভারিতে নিতে এখনই অর্ডার করুন! 🚀`;
    const fbAdHookEnglish = `Looking for the best ${productName}? Get premium quality, unbeatable price & Cash on Delivery anywhere in Bangladesh. Order today before stock runs out!`;

    const analysisResult = {
      id: 'res-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      productName,
      sourcePlatform,
      supplierUrl,
      supplierPriceBdt,
      weightGrams,
      targetSellingPrice,
      categoryHint,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
      
      // Cost breakdown
      costBreakdown: {
        supplierCost: supplierPriceBdt,
        airCargoFee: cargoFee,
        shippingCost,
        packagingCost,
        gatewayFee,
        adSpend,
        returnRiskCost,
        totalLandedCost,
      },

      // Profitability
      profitability: {
        netProfit,
        profitMargin,
        breakEvenSellingPrice,
        recommendedSellingPrice,
        breakEvenRoas,
      },

      // Scoring & Verdict
      score,
      verdict,
      verdictLevel,
      deliveryDaysText,

      // Market analysis
      strengths,
      risks,
      targetAudience: 'Urban youth, tech enthusiasts and online shoppers (Age 20-38) across Dhaka, Chattogram, Sylhet.',

      // Generated copy
      copywriting: {
        seoTitle,
        description,
        fbAdHookBangla,
        fbAdHookEnglish,
      },

      importStatus: 'WATCHLIST',
      analyzedAt: new Date().toISOString(),
    };

    // 6. Save to Watchlist in AuditLog
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
