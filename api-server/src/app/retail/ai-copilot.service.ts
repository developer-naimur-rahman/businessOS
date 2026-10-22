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

    // 5. Internet Service Applications & Appointments
    const internetAppLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'InternetServiceApplication',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const uniqueAppsMap = new Map<string, any>();
    for (const l of internetAppLogs) {
      if (!uniqueAppsMap.has(l.entityId) && l.newData) {
        uniqueAppsMap.set(l.entityId, l.newData);
      }
    }
    const allApps = Array.from(uniqueAppsMap.values());
    const pendingAppsCount = allApps.filter(a => a.status !== 'COMPLETED' && a.status !== 'DELIVERED' && a.status !== 'CANCELLED').length;
    const waitingForDocsCount = allApps.filter(a => a.status === 'AWAITING_CUSTOMER_INFO' || (a.missingDocuments && a.missingDocuments.length > 0)).length;
    const waitingForPaymentCount = allApps.filter(a => a.status === 'AWAITING_PAYMENT' || a.paymentEvidence?.paymentStatus === 'PENDING_VERIFICATION').length;

    // Tomorrow's appointments
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const appointmentLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'ServiceAppointment',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const tomorrowAppointments = appointmentLogs.filter(l => {
      const data = (l.newData as any) || {};
      return data.appointmentDate === tomorrowStr && data.status !== 'CANCELLED';
    }).length;
    const todayAppointments = appointmentLogs.filter(l => {
      const data = (l.newData as any) || {};
      return data.appointmentDate === todayStr && data.status !== 'CANCELLED';
    }).length;

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
      pendingPrintsCount,
      pendingAppsCount,
      waitingForDocsCount,
      waitingForPaymentCount,
      todayAppointments,
      tomorrowAppointments,
    };
  }

  async askCopilot(organizationId: string, dto: AskCopilotDto) {
    if (!dto.query || typeof dto.query !== 'string') {
      throw new BadRequestException('Query string is required.');
    }

    const query = dto.query.trim();
    const queryLower = query.toLowerCase();
    const snapshot = await this.gatherBusinessSnapshot(organizationId);

    // Contextual handling for Internet Service Center questions
    if (queryLower.includes('ডকুমেন্ট') || queryLower.includes('কাগজপত্র') || queryLower.includes('missing document') || queryLower.includes('waiting for doc')) {
      return {
        engine: 'ALGORITHMIC_FALLBACK',
        engineLabel: 'BusinessOS Service Center Engine',
        query,
        answer: `বর্তমানে ${snapshot.waitingForDocsCount}টি আবেদনে প্রয়োজনীয় কাগজপত্র বা তথ্যের জন্য অপেক্ষা করা হচ্ছে। কাস্টমারদের এসএমএস/হোয়াটসঅ্যাপ নোটিফিকেশন পাঠাতে সার্ভিস জব পাইপলাইনে যান।`,
        actionType: 'VIEW_SERVICE_APPLICATIONS',
        suggestions: [
          'কোন কোন আবেদন পেন্ডিং আছে?',
          'আগামীকালের অ্যাপয়েন্টমেন্ট শিডিউল দেখাও',
          'আজকের মোট সেলস ও ক্যাশ কত?'
        ],
        metricsSnapshot: snapshot,
        quickActions: [
          { label: 'View Service Applications', href: '/admin/service-jobs' },
          { label: 'Shop Appointments', href: '/admin/service-scheduling' },
          { label: 'Service Knowledge Base', href: '/admin/service-knowledge' }
        ]
      };
    }

    if (queryLower.includes('আগামীকাল') || queryLower.includes('tomorrow') || queryLower.includes('অ্যাপয়েন্টমেন্ট') || queryLower.includes('appointment')) {
      return {
        engine: 'ALGORITHMIC_FALLBACK',
        engineLabel: 'BusinessOS Service Scheduling Engine',
        query,
        answer: `আজ দোকানে ${snapshot.todayAppointments}টি এবং আগামীকাল ${snapshot.tomorrowAppointments}টি গ্রাহক অ্যাপয়েন্টমেন্ট কনফার্মড রয়েছে। নির্ধারিত সময়ে সার্ভিস ডেস্ক প্রস্তুত রাখুন।`,
        actionType: 'VIEW_SCHEDULING',
        suggestions: [
          'পেন্ডিং পেমেন্টগুলো দেখাও',
          'কাগজপত্রের জন্য কয়টি ফাইল অপেক্ষা করছে?',
          'আজকের সেলস রিপোর্ট'
        ],
        metricsSnapshot: snapshot,
        quickActions: [
          { label: 'Shop Appointment Calendar', href: '/admin/service-scheduling' },
          { label: 'Service Applications', href: '/admin/service-jobs' }
        ]
      };
    }

    if (queryLower.includes('পেমেন্ট') || queryLower.includes('payment') || queryLower.includes('টাকা বাকি') || queryLower.includes('baki')) {
      if (queryLower.includes('ভেরিফাই') || queryLower.includes('verification') || queryLower.includes('আবেদন')) {
        return {
          engine: 'ALGORITHMIC_FALLBACK',
          engineLabel: 'BusinessOS Ledger Engine',
          query,
          answer: `বর্তমানে ${snapshot.waitingForPaymentCount}টি অনলাইন সার্ভিস আবেদনে বিকাশ/নগদ পেমেন্ট ভেরিফিকেশন বাকি রয়েছে। লেনদেন ট্রানজেকশন আইডি মিলিয়ে অনুমোদন করুন।`,
          actionType: 'VIEW_PAYMENTS',
          suggestions: [
            'পেন্ডিং আবেদনগুলো দেখাও',
            'আজকের দোকানের কালেকশন কত?'
          ],
          metricsSnapshot: snapshot,
          quickActions: [
            { label: 'Verify Service Payments', href: '/admin/service-jobs' },
            { label: 'Digital Baki Khata', href: '/admin/baki-khata' }
          ]
        };
      }
    }

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
        { label: 'Service Applications', href: '/admin/service-jobs' },
        { label: 'Shop Appointments', href: '/admin/service-scheduling' },
        { label: 'Service Knowledge Base', href: '/admin/service-knowledge' },
        { label: 'View Today Sales', href: '/admin/sales' },
        { label: 'Send Baki Reminders', href: '/admin/baki-khata' },
      ]
    };
  }
}
