import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    metrics: {
      totalRevenue: 464345,
      netProfit: 155176,
      totalOrders: 42,
      activeProducts: 25,
      grossMargin: 40.4,
      totalCustomers: 18,
    },
    salesTrend: [
      { date: '2026-10-15', revenue: 42000 },
      { date: '2026-10-16', revenue: 58000 },
      { date: '2026-10-17', revenue: 64000 },
      { date: '2026-10-18', revenue: 71000 },
      { date: '2026-10-19', revenue: 89000 },
      { date: '2026-10-20', revenue: 95000 },
      { date: '2026-10-21', revenue: 104345 },
    ],
    recentSales: [
      { id: 'sale-1', customerName: 'Walk-in Customer', total: 450, paymentMethod: 'CASH', status: 'COMPLETED', createdAt: '2026-10-21T10:30:00Z' },
      { id: 'sale-2', customerName: 'Tanvir Ahmed', total: 1200, paymentMethod: 'BKASH', status: 'COMPLETED', createdAt: '2026-10-21T11:15:00Z' },
      { id: 'sale-3', customerName: 'Rahim Print Client', total: 3500, paymentMethod: 'NAGAD', status: 'COMPLETED', createdAt: '2026-10-21T12:00:00Z' },
    ]
  })
}
