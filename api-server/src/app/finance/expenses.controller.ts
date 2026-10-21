import { 
  Controller, Get, Post, Delete, Body, Param, Query, 
  UseGuards, Request, NotFoundException, BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Decimal } from '@prisma/client/runtime/library';
import { randomUUID } from 'crypto';

export interface CreateExpenseDto {
  amount: number;
  category: string;
  paymentMethod: 'CASH' | 'BKASH' | 'NAGAD' | 'BANK';
  description: string;
  receiptReference?: string;
  receiptRef?: string;
  branchId?: string;
  expenseDate?: string;
}

export interface CloseCashRegisterDto {
  date: string;
  openingBalance: number;
  totalCashSales: number;
  totalMobileBanking: number;
  totalCashExpenses: number;
  expectedClosingBalance: number;
  actualCountedCash: number;
  variance: number;
  denominationBreakdown?: Record<string, number>;
  notes?: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
  ) {}

  private async getOrganizationId(req: any): Promise<string> {
    if (req.user?.organizationId) {
      return req.user.organizationId;
    }
    const org = await this.prisma.organization.findFirst();
    if (!org) {
      throw new NotFoundException('Organization not configured.');
    }
    return org.id;
  }

  // ==========================================
  // 1. EXPENSES MANAGEMENT
  // ==========================================

  @Get('expenses')
  async getExpenses(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const orgId = await this.getOrganizationId(req);
    const page = Math.max(1, parseInt(pageStr || '1', 10) || 1);
    const limit = Math.max(1, Math.min(200, parseInt(limitStr || '50', 10) || 50));

    // Fetch all non-deleted expense logs for this org
    const allLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId: orgId,
        entityType: 'Expense',
        action: { not: 'DELETED' },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let todayTotal = 0;
    let monthTotal = 0;
    const categoryBreakdown: Record<string, number> = {};

    const parsedExpenses = allLogs.map((log) => {
      const data = (log.newData as any) || {};
      const expenseDate = data.expenseDate || log.createdAt.toISOString();
      const amount = Number(data.amount) || 0;
      const cat = (data.category || 'MISCELLANEOUS').toUpperCase();

      // Accumulate today
      if (expenseDate.startsWith(todayStr)) {
        todayTotal += amount;
      }
      // Accumulate this month
      if (expenseDate.startsWith(currentYearMonth)) {
        monthTotal += amount;
      }

      // Category breakdown
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amount;

      return {
        id: log.id,
        expenseId: log.entityId,
        amount,
        category: cat,
        paymentMethod: data.paymentMethod || 'CASH',
        description: data.description || '',
        receiptRef: data.receiptRef || data.receiptReference || '',
        branchId: data.branchId || null,
        branchName: data.branchName || null,
        expenseDate,
        journalEntryId: data.journalEntryId || null,
        createdByUserId: log.userId || data.createdByUserId,
        createdByName: data.createdByName || 'Admin',
        createdAt: log.createdAt,
      };
    });

    // Find top category
    let topCategory = 'None';
    let maxCategorySpend = 0;
    for (const [cat, amt] of Object.entries(categoryBreakdown)) {
      if (amt > maxCategorySpend) {
        maxCategorySpend = amt;
        topCategory = cat;
      }
    }

    // Filter in-memory
    let filtered = parsedExpenses;

    if (startDate) {
      filtered = filtered.filter(e => e.expenseDate >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(e => e.expenseDate <= `${endDate}T23:59:59.999Z`);
    }
    if (category && category !== 'ALL') {
      filtered = filtered.filter(e => e.category.toUpperCase() === category.toUpperCase());
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(e => 
        e.description.toLowerCase().includes(q) ||
        e.receiptRef.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.paymentMethod.toLowerCase().includes(q)
      );
    }

    const totalCount = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      expenses: paginated,
      metrics: {
        todayTotal,
        monthTotal,
        totalCount: parsedExpenses.length,
        filteredCount: totalCount,
        topCategory,
        categoryBreakdown,
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  @Post('expenses')
  async recordExpense(@Request() req: any, @Body() body: CreateExpenseDto) {
    if (!body.amount || Number(body.amount) <= 0) {
      throw new BadRequestException('Expense amount must be greater than zero.');
    }
    if (!body.category?.trim()) {
      throw new BadRequestException('Expense category is required.');
    }
    if (!body.description?.trim()) {
      throw new BadRequestException('Expense description is required.');
    }

    const orgId = await this.getOrganizationId(req);
    const userId = req.user?.id || 'SYSTEM';
    const amount = Number(body.amount);
    const category = body.category.trim().toUpperCase();
    const paymentMethod = (body.paymentMethod || 'CASH').toUpperCase() as 'CASH' | 'BKASH' | 'NAGAD' | 'BANK';
    const expenseDate = body.expenseDate ? new Date(body.expenseDate).toISOString() : new Date().toISOString();
    const receiptRef = (body.receiptRef || body.receiptReference || '').trim();

    // Branch resolution
    let branchName: string | null = null;
    if (body.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: body.branchId, organizationId: orgId },
      });
      if (branch) {
        branchName = branch.name;
      }
    }

    // User name resolution
    let createdByName = req.user?.firstName ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : (req.user?.email || 'Store Cashier');
    if (userId && userId !== 'SYSTEM') {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.firstName) {
        createdByName = `${user.firstName} ${user.lastName || ''}`.trim();
      }
    }

    const expenseId = randomUUID();
    let journalEntryId: string | null = null;

    // Optional General Ledger posting if accounting accounts exist
    try {
      const expenseAccount = await this.prisma.account.findFirst({
        where: {
          code: '5001',
          type: 'EXPENSE',
          chartOfAccounts: { organizationId: orgId },
        },
      });

      let creditAccountCode = '1001'; // Default Cash
      if (paymentMethod === 'BKASH' || paymentMethod === 'NAGAD') {
        creditAccountCode = '1003'; // Mobile Banking
      } else if (paymentMethod === 'BANK') {
        creditAccountCode = '1002'; // Bank
      }

      const creditAccount = await this.prisma.account.findFirst({
        where: {
          code: creditAccountCode,
          chartOfAccounts: { organizationId: orgId },
        },
      });

      const openPeriod = await this.prisma.fiscalPeriod.findFirst({
        where: {
          organizationId: orgId,
          status: 'OPEN',
          startDate: { lte: new Date(expenseDate) },
          endDate: { gte: new Date(expenseDate) },
        },
      });

      if (expenseAccount && creditAccount && openPeriod) {
        const draft = await this.financeService.createDraftJournalEntry(orgId, userId, {
          accountingDate: new Date(expenseDate),
          fiscalPeriodId: openPeriod.id,
          referenceType: 'EXPENSE',
          referenceId: expenseId,
          description: `Expense: ${category} - ${body.description}`,
          lines: [
            {
              accountId: expenseAccount.id,
              debit: new Decimal(amount),
              branchId: body.branchId || undefined,
            },
            {
              accountId: creditAccount.id,
              credit: new Decimal(amount),
              branchId: body.branchId || undefined,
            },
          ],
        });

        await this.financeService.postJournalEntry(orgId, draft.id, userId);
        journalEntryId = draft.id;
      }
    } catch (ledgerErr) {
      console.warn('Accounting auto-posting skipped or failed:', ledgerErr);
    }

    // Save expense to AuditLog
    const record = await this.prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId: userId !== 'SYSTEM' ? userId : null,
        entityType: 'Expense',
        entityId: expenseId,
        action: 'RECORDED',
        newData: {
          id: expenseId,
          amount,
          category,
          paymentMethod,
          description: body.description.trim(),
          receiptRef,
          branchId: body.branchId || null,
          branchName,
          expenseDate,
          journalEntryId,
          createdByUserId: userId,
          createdByName,
          createdAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: `Expense of ৳${amount.toLocaleString()} recorded successfully.`,
      expense: {
        id: record.id,
        expenseId,
        amount,
        category,
        paymentMethod,
        description: body.description.trim(),
        receiptRef,
        branchId: body.branchId || null,
        branchName,
        expenseDate,
        journalEntryId,
        createdAt: record.createdAt,
      },
    };
  }

  @Delete('expenses/:id')
  async deleteExpense(@Request() req: any, @Param('id') id: string) {
    const orgId = await this.getOrganizationId(req);

    const log = await this.prisma.auditLog.findFirst({
      where: {
        organizationId: orgId,
        entityType: 'Expense',
        OR: [
          { id },
          { entityId: id },
        ],
      },
    });

    if (!log) {
      throw new NotFoundException('Expense record not found.');
    }

    // Mark as DELETED to preserve audit trail
    await this.prisma.auditLog.update({
      where: { id: log.id },
      data: {
        action: 'DELETED',
      },
    });

    return {
      success: true,
      message: 'Expense record deleted successfully.',
    };
  }

  // ==========================================
  // 2. CASH REGISTER / DAILY TILL RECONCILIATION
  // ==========================================

  @Get('cash-register/summary')
  async getCashRegisterSummary(@Request() req: any, @Query('date') dateQuery?: string) {
    const orgId = await this.getOrganizationId(req);

    const targetDateStr = dateQuery ? dateQuery.split('T')[0] : new Date().toISOString().split('T')[0];
    const startOfDay = new Date(`${targetDateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${targetDateStr}T23:59:59.999Z`);

    // 1. Fetch opening cash recorded for this date or from previous close
    const openingLog = await this.prisma.auditLog.findFirst({
      where: {
        organizationId: orgId,
        entityType: 'CashRegisterOpening',
        entityId: `${orgId}-${targetDateStr}`,
      },
      orderBy: { createdAt: 'desc' },
    });

    let openingBalance = 0;
    if (openingLog && openingLog.newData) {
      openingBalance = Number((openingLog.newData as any).openingBalance) || 0;
    } else {
      // Look for latest closing before this day
      const prevClosing = await this.prisma.auditLog.findFirst({
        where: {
          organizationId: orgId,
          entityType: 'CashRegisterClosing',
          createdAt: { lt: startOfDay },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (prevClosing && prevClosing.newData) {
        openingBalance = Number((prevClosing.newData as any).actualCountedCash) || 
                         Number((prevClosing.newData as any).expectedClosingBalance) || 0;
      }
    }

    // 2. Cash sales received today (from SalePayment where method = 'CASH')
    const cashPayments = await this.prisma.salePayment.findMany({
      where: {
        organizationId: orgId,
        method: 'CASH',
        paymentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
    const totalCashSales = cashPayments.reduce((acc, p) => acc + Number(p.amount), 0);

    // 3. Mobile banking receipts today (bKash/Nagad)
    const mobilePayments = await this.prisma.salePayment.findMany({
      where: {
        organizationId: orgId,
        method: 'MOBILE_BANKING',
        paymentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
    const totalMobileBanking = mobilePayments.reduce((acc, p) => acc + Number(p.amount), 0);

    // 4. Bank sales receipts today
    const bankPayments = await this.prisma.salePayment.findMany({
      where: {
        organizationId: orgId,
        method: 'BANK',
        paymentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
    const totalBankPayments = bankPayments.reduce((acc, p) => acc + Number(p.amount), 0);

    // 5. Total expenses paid from cash drawer today
    const expenseLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId: orgId,
        entityType: 'Expense',
        action: { not: 'DELETED' },
      },
    });

    let totalCashExpenses = 0;
    let totalOtherExpenses = 0;
    const todayExpenses: any[] = [];

    for (const log of expenseLogs) {
      const data = (log.newData as any) || {};
      const expDate = data.expenseDate || log.createdAt.toISOString();
      if (expDate.startsWith(targetDateStr)) {
        const amt = Number(data.amount) || 0;
        const method = (data.paymentMethod || 'CASH').toUpperCase();
        if (method === 'CASH') {
          totalCashExpenses += amt;
        } else {
          totalOtherExpenses += amt;
        }
        todayExpenses.push({
          id: log.id,
          amount: amt,
          category: data.category,
          paymentMethod: method,
          description: data.description,
          receiptRef: data.receiptRef,
        });
      }
    }

    // 6. Expected closing cash in till
    const expectedClosingBalance = Math.max(0, openingBalance + totalCashSales - totalCashExpenses);

    // 7. Check if day is already closed
    const closingLog = await this.prisma.auditLog.findFirst({
      where: {
        organizationId: orgId,
        entityType: 'CashRegisterClosing',
        entityId: `${orgId}-${targetDateStr}`,
      },
      orderBy: { createdAt: 'desc' },
    });

    const isClosed = !!closingLog;
    const closingData = closingLog ? (closingLog.newData as any) : null;

    return {
      date: targetDateStr,
      openingBalance,
      totalCashSales,
      cashSalesCount: cashPayments.length,
      totalMobileBanking,
      mobileBankingCount: mobilePayments.length,
      totalBankPayments,
      bankCount: bankPayments.length,
      totalCashExpenses,
      cashExpensesCount: todayExpenses.filter(e => e.paymentMethod === 'CASH').length,
      totalOtherExpenses,
      expectedClosingBalance,
      isClosed,
      closingData,
      todayExpenses,
    };
  }

  @Post('cash-register/opening')
  async setOpeningBalance(@Request() req: any, @Body() body: { date: string; openingBalance: number; notes?: string }) {
    if (body.openingBalance === undefined || body.openingBalance < 0) {
      throw new BadRequestException('Valid opening balance is required.');
    }

    const orgId = await this.getOrganizationId(req);
    const dateStr = (body.date || new Date().toISOString()).split('T')[0];
    const userId = req.user?.id || null;

    const record = await this.prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId,
        entityType: 'CashRegisterOpening',
        entityId: `${orgId}-${dateStr}`,
        action: 'SET',
        newData: {
          date: dateStr,
          openingBalance: Number(body.openingBalance),
          notes: body.notes?.trim() || null,
          setAt: new Date().toISOString(),
          setBy: req.user?.firstName ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : (req.user?.email || 'Cashier'),
        },
      },
    });

    return {
      success: true,
      message: `Opening balance for ${dateStr} set to ৳${Number(body.openingBalance).toLocaleString()}.`,
      data: record.newData,
    };
  }

  @Post('cash-register/close')
  async closeCashRegister(@Request() req: any, @Body() body: CloseCashRegisterDto) {
    if (!body.date) {
      throw new BadRequestException('Date is required for closing cash register.');
    }
    if (body.actualCountedCash === undefined || body.actualCountedCash < 0) {
      throw new BadRequestException('Physical counted cash amount is required.');
    }

    const orgId = await this.getOrganizationId(req);
    const dateStr = body.date.split('T')[0];
    const userId = req.user?.id || null;

    const openingBalance = Number(body.openingBalance) || 0;
    const totalCashSales = Number(body.totalCashSales) || 0;
    const totalMobileBanking = Number(body.totalMobileBanking) || 0;
    const totalCashExpenses = Number(body.totalCashExpenses) || 0;
    const expectedClosingBalance = Number(body.expectedClosingBalance) || (openingBalance + totalCashSales - totalCashExpenses);
    const actualCountedCash = Number(body.actualCountedCash);
    const variance = actualCountedCash - expectedClosingBalance;

    const closingPayload = {
      date: dateStr,
      openingBalance,
      totalCashSales,
      totalMobileBanking,
      totalCashExpenses,
      expectedClosingBalance,
      actualCountedCash,
      variance,
      denominationBreakdown: body.denominationBreakdown || {},
      notes: body.notes?.trim() || '',
      closedAt: new Date().toISOString(),
      closedByUserId: userId,
      closedByName: req.user?.firstName ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : (req.user?.email || 'Store Cashier'),
    };

    const record = await this.prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId,
        entityType: 'CashRegisterClosing',
        entityId: `${orgId}-${dateStr}`,
        action: 'CLOSED',
        newData: closingPayload,
      },
    });

    return {
      success: true,
      message: `Daily register for ${dateStr} locked. Variance: ${variance >= 0 ? '+' : ''}৳${variance.toLocaleString()}`,
      data: record.newData,
    };
  }

  @Get('cash-register/history')
  async getCashRegisterHistory(@Request() req: any) {
    const orgId = await this.getOrganizationId(req);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId: orgId,
        entityType: 'CashRegisterClosing',
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return logs.map((l) => ({
      id: l.id,
      ...(l.newData as any),
      createdAt: l.createdAt,
    }));
  }

  // ==========================================
  // 3. PROFIT & LOSS (P&L) STATEMENT REPORT
  // ==========================================

  @Get('finance/profit-loss')
  async getProfitLossStatement(
    @Request() req: any,
    @Query('startDate') startDateQuery?: string,
    @Query('endDate') endDateQuery?: string,
    @Query('preset') preset?: string,
  ) {
    const orgId = await this.getOrganizationId(req);

    const now = new Date();
    let startDateTime: Date;
    let endDateTime: Date;

    if (preset === 'THIS_MONTH') {
      startDateTime = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDateTime = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (preset === 'LAST_MONTH') {
      startDateTime = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDateTime = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (preset === 'THIS_QUARTER') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      startDateTime = new Date(now.getFullYear(), qMonth, 1, 0, 0, 0, 0);
      endDateTime = new Date(now.getFullYear(), qMonth + 3, 0, 23, 59, 59, 999);
    } else if (preset === 'THIS_YEAR') {
      startDateTime = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDateTime = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (startDateQuery && endDateQuery) {
      startDateTime = new Date(`${startDateQuery.split('T')[0]}T00:00:00.000Z`);
      endDateTime = new Date(`${endDateQuery.split('T')[0]}T23:59:59.999Z`);
    } else {
      // Default: Last 365 days / all time for comprehensive visibility
      startDateTime = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDateTime = new Date(`${now.toISOString().split('T')[0]}T23:59:59.999Z`);
    }

    // 1. Fetch Sales Revenue (all completed or positive sales in range)
    const sales = await this.prisma.sale.findMany({
      where: {
        organizationId: orgId,
        saleDate: {
          gte: startDateTime,
          lte: endDateTime,
        },
      },
      include: {
        lines: {
          include: {
            variant: {
              select: {
                id: true,
                costPrice: true,
                retailPrice: true,
              },
            },
          },
        },
      },
    });

    let grossRevenue = 0;
    let totalDiscounts = 0;
    let netRevenue = 0;
    let totalCogs = 0;

    const monthlyAggregation: Record<string, { revenue: number; cogs: number; expenses: number; netProfit: number }> = {};

    sales.forEach((sale) => {
      const saleNet = Number(sale.total) || 0;
      const saleSubtotal = Number(sale.subtotal) || saleNet;
      const saleDisc = Number(sale.discount) || 0;

      grossRevenue += saleSubtotal;
      totalDiscounts += saleDisc;
      netRevenue += saleNet;

      const monthKey = sale.saleDate.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyAggregation[monthKey]) {
        monthlyAggregation[monthKey] = { revenue: 0, cogs: 0, expenses: 0, netProfit: 0 };
      }
      monthlyAggregation[monthKey].revenue += saleNet;

      // Compute COGS for sale lines
      sale.lines.forEach((line) => {
        const qty = Number(line.quantity) || 1;
        const lineTotal = Number(line.lineTotal) || (Number(line.unitPrice) * qty);
        const costPrice = line.variant?.costPrice !== null && line.variant?.costPrice !== undefined
          ? Number(line.variant.costPrice)
          : null;

        let lineCost = 0;
        if (costPrice !== null && costPrice > 0) {
          lineCost = qty * costPrice;
        } else {
          // Standard wholesale benchmark (65% COGS = 35% gross profit)
          lineCost = Math.round(lineTotal * 0.65);
        }

        totalCogs += lineCost;
        monthlyAggregation[monthKey].cogs += lineCost;
      });
    });

    // 2. Fetch Operating Expenses from Daily Expense Tracker
    const expenseLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId: orgId,
        entityType: 'Expense',
        action: { not: 'DELETED' },
      },
    });

    let totalExpenses = 0;
    const categoryExpenses: Record<string, number> = {
      RENT: 0,
      UTILITIES: 0,
      SALARY: 0,
      SUPPLIES: 0,
      MAINTENANCE: 0,
      MISCELLANEOUS: 0,
    };

    expenseLogs.forEach((log) => {
      const data = (log.newData as any) || {};
      const expDate = data.expenseDate ? new Date(data.expenseDate) : log.createdAt;

      if (expDate >= startDateTime && expDate <= endDateTime) {
        const amt = Number(data.amount) || 0;
        const cat = (data.category || 'MISCELLANEOUS').toUpperCase();

        totalExpenses += amt;
        categoryExpenses[cat] = (categoryExpenses[cat] || 0) + amt;

        const monthKey = expDate.toISOString().slice(0, 7);
        if (!monthlyAggregation[monthKey]) {
          monthlyAggregation[monthKey] = { revenue: 0, cogs: 0, expenses: 0, netProfit: 0 };
        }
        monthlyAggregation[monthKey].expenses += amt;
      }
    });

    // 3. Profit Calculations
    const grossProfit = netRevenue - totalCogs;
    const grossMarginPercent = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;
    const netProfit = grossProfit - totalExpenses;
    const netMarginPercent = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

    // Monthly breakdown list sorted
    const monthlyBreakdown = Object.entries(monthlyAggregation)
      .map(([month, data]) => {
        const mGrossProfit = data.revenue - data.cogs;
        const mNetProfit = mGrossProfit - data.expenses;
        return {
          month,
          revenue: Math.round(data.revenue),
          cogs: Math.round(data.cogs),
          grossProfit: Math.round(mGrossProfit),
          expenses: Math.round(data.expenses),
          netProfit: Math.round(mNetProfit),
          netMarginPercent: data.revenue > 0 ? Math.round((mNetProfit / data.revenue) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.month.localeCompare(a.month));

    return {
      period: {
        startDate: startDateTime.toISOString().split('T')[0],
        endDate: endDateTime.toISOString().split('T')[0],
        preset: preset || 'CUSTOM',
      },
      summary: {
        grossRevenue: Math.round(grossRevenue),
        totalDiscounts: Math.round(totalDiscounts),
        netRevenue: Math.round(netRevenue),
        totalSalesCount: sales.length,
        totalCogs: Math.round(totalCogs),
        cogsPercentage: netRevenue > 0 ? Math.round((totalCogs / netRevenue) * 1000) / 10 : 0,
        grossProfit: Math.round(grossProfit),
        grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
        totalExpenses: Math.round(totalExpenses),
        expenseRatioPercent: netRevenue > 0 ? Math.round((totalExpenses / netRevenue) * 1000) / 10 : 0,
        netProfit: Math.round(netProfit),
        netMarginPercent: Math.round(netMarginPercent * 10) / 10,
      },
      operatingExpenses: {
        categories: categoryExpenses,
        total: Math.round(totalExpenses),
      },
      monthlyBreakdown,
    };
  }
}
