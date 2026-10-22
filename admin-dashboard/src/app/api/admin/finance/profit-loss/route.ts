import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const preset = searchParams.get('preset') || 'ALL_TIME';
  const startDate = searchParams.get('startDate') || '2026-01-01';
  const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

  const grossRevenue = 385400;
  const totalDiscounts = 8200;
  const netRevenue = grossRevenue - totalDiscounts; // 377200
  const totalSalesCount = 284;
  const totalCogs = 212500;
  const cogsPercentage = Math.round((totalCogs / netRevenue) * 100); // ~56%
  const grossProfit = netRevenue - totalCogs; // 164700
  const grossMarginPercent = Math.round((grossProfit / netRevenue) * 100); // ~44%

  const categories = {
    'দোকান ও গোডাউন ভাড়া (Rent)': 25000,
    'কর্মচারী বেতন ও কমিশন (Payroll)': 38000,
    'বিদ্যুৎ, ইন্টারনেট ও ইউটিলিটি (Utilities)': 6500,
    'স্টেশনারি ও প্যাকিং ম্যাটেরিয়ালস (Packaging)': 4200,
    'অনলাইন ফেসবুক অ্যাড ও প্রমোশন (Marketing)': 8500,
    'মেশিন কালি ও সার্ভিসিং (Maintenance)': 5200
  };

  const totalExpenses = Object.values(categories).reduce((acc, curr) => acc + curr, 0); // 87400
  const expenseRatioPercent = Math.round((totalExpenses / netRevenue) * 100);
  const netProfit = grossProfit - totalExpenses; // 77300
  const netMarginPercent = Math.round((netProfit / netRevenue) * 100); // ~20%

  const monthlyBreakdown = [
    {
      month: 'July 2026',
      revenue: 85000,
      cogs: 48000,
      grossProfit: 37000,
      expenses: 19500,
      netProfit: 17500,
      netMarginPercent: 21
    },
    {
      month: 'August 2026',
      revenue: 92000,
      cogs: 51000,
      grossProfit: 41000,
      expenses: 21000,
      netProfit: 20000,
      netMarginPercent: 22
    },
    {
      month: 'September 2026',
      revenue: 104000,
      cogs: 58500,
      grossProfit: 45500,
      expenses: 23400,
      netProfit: 22100,
      netMarginPercent: 21
    },
    {
      month: 'October 2026',
      revenue: 96200,
      cogs: 55000,
      grossProfit: 41200,
      expenses: 23500,
      netProfit: 17700,
      netMarginPercent: 18
    }
  ];

  return NextResponse.json({
    period: {
      startDate,
      endDate,
      preset
    },
    summary: {
      grossRevenue,
      totalDiscounts,
      netRevenue,
      totalSalesCount,
      totalCogs,
      cogsPercentage,
      grossProfit,
      grossMarginPercent,
      totalExpenses,
      expenseRatioPercent,
      netProfit,
      netMarginPercent
    },
    operatingExpenses: {
      categories,
      total: totalExpenses
    },
    monthlyBreakdown
  });
}
