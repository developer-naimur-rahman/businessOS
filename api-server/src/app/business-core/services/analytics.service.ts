import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as ss from 'simple-statistics';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(organizationId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. Fetch Income (Sales)
    const sales = await this.prisma.sale.findMany({
      where: {
        organizationId,
        status: 'COMPLETED',
        saleDate: { gte: startDate }
      },
      select: {
        saleDate: true,
        total: true,
      }
    });

    // 2. Fetch Costing (Purchases)
    const purchases = await this.prisma.purchase.findMany({
      where: {
        organizationId,
        status: 'COMPLETED',
        purchaseDate: { gte: startDate }
      },
      select: {
        purchaseDate: true,
        total: true,
      }
    });

    // 3. Aggregate Data by Date
    const dailyData: Record<string, { income: number, cost: number, date: string, timestamp: number }> = {};
    
    // Initialize dates
    for(let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      dailyData[dateStr] = { income: 0, cost: 0, date: dateStr, timestamp: d.getTime() };
    }

    sales.forEach(sale => {
      const dateStr = new Date(sale.saleDate).toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].income += Number(sale.total);
      }
    });

    purchases.forEach(purchase => {
      const dateStr = new Date(purchase.purchaseDate).toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].cost += Number(purchase.total);
      }
    });

    const historicalData = Object.values(dailyData).sort((a, b) => a.timestamp - b.timestamp);

    // 4. Calculate Totals
    const totalIncome = historicalData.reduce((sum, day) => sum + day.income, 0);
    const totalCost = historicalData.reduce((sum, day) => sum + day.cost, 0);
    const grossProfit = totalIncome - totalCost;
    const profitMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;

    // 5. Predictive Forecasting (Linear Regression on Income)
    let forecast = [];
    if (historicalData.length > 5 && totalIncome > 0) {
      // Map data to [x, y] where x is the day index, y is income
      const dataPoints = historicalData.map((d, index) => [index, d.income]);
      
      const regressionLine = ss.linearRegressionLine(ss.linearRegression(dataPoints));
      
      // Predict next 7 days
      for (let i = 1; i <= 7; i++) {
        const futureIndex = historicalData.length - 1 + i;
        const predictedIncome = Math.max(0, regressionLine(futureIndex)); // Don't predict negative income
        
        const d = new Date();
        d.setDate(d.getDate() + i);
        
        forecast.push({
          date: d.toISOString().split('T')[0],
          forecastIncome: predictedIncome
        });
      }
    }

    // 6. Inventory Risk Analysis
    const stockBalances = await this.prisma.stockBalance.findMany({
      where: { organizationId },
      include: {
        variant: {
          include: { product: true }
        }
      }
    });

    const lowStockThreshold = 10;
    const outOfStock = [];
    const lowStock = [];
    
    stockBalances.forEach(stock => {
      const name = stock.variant?.product?.name || 'Unknown Product';
      const qty = Number(stock.quantity);
      if (qty <= 0) {
        outOfStock.push({ id: stock.id, name, quantity: qty });
      } else if (qty <= lowStockThreshold) {
        lowStock.push({ id: stock.id, name, quantity: qty });
      }
    });

    // 7. Automated Warnings & Recommendations
    const alerts = [];
    
    // Inventory Alerts
    if (outOfStock.length > 0) {
      alerts.push({
        type: 'critical',
        title: 'Out of Stock',
        message: `${outOfStock.length} products are completely out of stock.`,
        action: 'Review inventory and create purchase orders immediately.',
        items: outOfStock.slice(0, 3)
      });
    } else if (lowStock.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${lowStock.length} products are below the minimum threshold of ${lowStockThreshold}.`,
        action: 'Consider restocking soon to prevent lost sales.',
        items: lowStock.slice(0, 3)
      });
    }

    // Profitability Alerts
    if (totalCost > totalIncome && totalIncome > 0) {
      alerts.push({
        type: 'critical',
        title: 'Negative Cashflow Warning',
        message: `Your costs (৳${totalCost.toLocaleString()}) exceeded your income (৳${totalIncome.toLocaleString()}) over the last ${days} days.`,
        action: 'Review recent expenses and supplier costs.'
      });
    } else if (profitMargin < 15 && totalIncome > 0) {
      alerts.push({
        type: 'warning',
        title: 'Low Profit Margin',
        message: `Your profit margin is currently ${profitMargin.toFixed(1)}%.`,
        action: 'Evaluate pricing strategies and analyze cost of goods sold.'
      });
    }

    // Customer Alerts
    const customersWithBalance: any[] = await this.prisma.$queryRaw`
      SELECT c.name, 
             COALESCE(SUM(s.total), 0) as "totalBilled", 
             COALESCE((SELECT SUM(amount) FROM "SalePayment" WHERE "saleId" IN (SELECT id FROM "Sale" WHERE "customerId" = c.id)), 0) as "totalPaid"
      FROM "Customer" c
      LEFT JOIN "Sale" s ON s."customerId" = c.id
      WHERE c."organizationId" = ${organizationId}
      GROUP BY c.id, c.name
      HAVING COALESCE(SUM(s.total), 0) - COALESCE((SELECT SUM(amount) FROM "SalePayment" WHERE "saleId" IN (SELECT id FROM "Sale" WHERE "customerId" = c.id)), 0) > 1000
    `;

    if (Array.isArray(customersWithBalance) && customersWithBalance.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Outstanding Receivables',
        message: `${customersWithBalance.length} customers have significant outstanding balances.`,
        action: 'Review customer statements and send payment reminders.'
      });
    } else if (historicalData.length < 5) {
      alerts.push({
        type: 'info',
        title: 'Insufficient Data',
        message: 'Insufficient historical data for a highly accurate forecast.',
        action: 'Continue recording sales and expenses. Forecasts will improve as more data is collected.'
      });
    }

    // Combine historical and forecast data for the UI
    const chartData = [...historicalData.map(d => ({ ...d, type: 'actual' })), ...forecast.map(d => ({ ...d, type: 'forecast' }))];

    return {
      metrics: {
        totalIncome,
        totalCost,
        grossProfit,
        profitMargin,
        period: `${days} Days`
      },
      chartData,
      inventoryRisk: {
        outOfStockCount: outOfStock.length,
        lowStockCount: lowStock.length
      },
      alerts,
      methodology: {
        forecastMethod: 'Simple Linear Regression (OLS)',
        horizon: '7 Days',
        observations: historicalData.length
      }
    };
  }
}
