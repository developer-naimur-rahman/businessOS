import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { HybridIntelligenceService } from '../common/services/hybrid-intelligence.service';

export interface AskCopilotDto {
  query: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
}

@Injectable()
export class AiCopilotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hybridIntelligence: HybridIntelligenceService
  ) {}

  private async gatherBusinessSnapshot(organizationId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // 1. Sales
    const todaySales = await this.prisma.sale.findMany({
      where: {
        organizationId,
        status: 'COMPLETED',
        createdAt: { gte: startOfToday }
      },
      select: { total: true }
    });
    const todaySalesCount = todaySales.length;
    const todayRevenueBdt = todaySales.reduce((acc, s) => acc + Number(s.total || 0), 0);

    const monthSales = await this.prisma.sale.findMany({
      where: {
        organizationId,
        status: 'COMPLETED',
        createdAt: { gte: startOfMonth }
      },
      select: { total: true }
    });
    const monthlyRevenueBdt = monthSales.reduce((acc, s) => acc + Number(s.total || 0), 0);

    // 2. Low Stock Items
    const activeVariants = await this.prisma.productVariant.findMany({
      where: {
        organizationId,
        status: 'ACTIVE'
      },
      include: { 
        product: true,
        stockBalances: true
      },
      take: 15
    });

    const lowStockItems = activeVariants.map(v => {
      const stock = v.stockBalances?.reduce((sum, sb) => sum + Number(sb.quantity || 0), 0) || 0;
      return {
        name: v.product.name,
        sku: v.sku,
        stock
      };
    }).filter(i => i.stock <= 5);

    const lowStockCount = lowStockItems.length;
    const lowStockSummary = lowStockItems.slice(0, 6).map(i => `${i.name} (SKU: ${i.sku}, Stock: ${i.stock})`).join(', ');

    // 3. Baki Khata
    const bakiLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'BakiKhataTransaction'
      },
      take: 200
    });
    let totalBakiDueBdt = 0;
    const customerDueMap: Record<string, { name: string; due: number }> = {};
    for (const l of bakiLogs) {
      const data = (l.newData as any) || {};
      const cid = data.customerId || 'default';
      if (!customerDueMap[cid]) customerDueMap[cid] = { name: data.customerName || 'Customer', due: 0 };
      if (data.type === 'NEW_BAKI_SALE') {
        customerDueMap[cid].due += Number(data.amountBdt || 0);
        totalBakiDueBdt += Number(data.amountBdt || 0);
      } else if (data.type === 'DUE_COLLECTION') {
        customerDueMap[cid].due -= Number(data.amountBdt || 0);
        totalBakiDueBdt = Math.max(0, totalBakiDueBdt - Number(data.amountBdt || 0));
      }
    }
    const topDebtors = Object.values(customerDueMap)
      .filter(c => c.due > 0)
      .sort((a, b) => b.due - a.due)
      .slice(0, 4)
      .map(c => `${c.name}: ৳${c.due.toLocaleString()}`)
      .join('; ');

    // 4. Pending Service Jobs & Print Drops
    const pendingJobs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'ServiceJobTicket',
        action: { not: 'UPDATE_SERVICE_JOB_STATUS_DELIVERED' }
      },
      take: 20
    });
    const pendingJobsCount = pendingJobs.length;

    const pendingPrints = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'PrintQueueDrop',
        action: { not: 'UPDATE_PRINT_STATUS_BILLED_COMPLETED' }
      },
      take: 20
    });
    const pendingPrintsCount = pendingPrints.length;

    return {
      todaySales: todayRevenueBdt,
      todaySalesCount,
      todayRevenueBdt,
      monthlyRevenueBdt,
      grossProfit: Math.round(todayRevenueBdt * 0.3),
      salesCount: todaySalesCount,
      lowStockCount,
      lowStockSummary: lowStockSummary || 'All products have adequate stock',
      totalBakiDueBdt,
      topDebtors: topDebtors || 'No major overdue accounts',
      pendingJobsCount,
      pendingPrintsCount
    };
  }

  async askCopilot(organizationId: string, dto: AskCopilotDto) {
    if (!dto.query || typeof dto.query !== 'string') {
      throw new BadRequestException('Query string is required.');
    }

    const query = dto.query.trim();
    const snapshot = await this.gatherBusinessSnapshot(organizationId);

    // Call Hybrid Intelligence askCopilot
    const copilotResult = await this.hybridIntelligence.askCopilot(query, snapshot);

    const hasApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5;
    const engine = hasApiKey ? 'AI_GEMINI' : 'ALGORITHMIC_FALLBACK';
    const engineLabel = hasApiKey ? 'Google Gemini 1.5 Pro AI' : 'Algorithmic Intelligence';

    return {
      engine,
      engineLabel,
      query,
      answer: copilotResult.reply,
      actionType: copilotResult.actionType,
      suggestions: copilotResult.suggestions,
      metricsSnapshot: snapshot,
      quickActions: [
        { label: 'View Today Sales', href: '/admin/sales' },
        { label: 'Send Baki Reminders', href: '/admin/baki-khata' },
        { label: 'Bazaar Sourcing Sheet', href: '/admin/sourcing-list' }
      ]
    };
  }
}
