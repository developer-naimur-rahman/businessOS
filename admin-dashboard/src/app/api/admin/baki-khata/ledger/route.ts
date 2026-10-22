import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    totalMarketDueBdt: 4650,
    collectedThisMonthBdt: 12500,
    overdueCustomersCount: 2,
    totalCustomersWithDue: 2,
    customers: [
      {
        id: '01fbf875-ad53-4b76-9649-5ed88c1fb043',
        name: 'Local High School',
        phone: '0171974862',
        customerType: 'BUSINESS',
        dueAmount: 1450,
        creditLimit: 15000,
        daysOverdue: 14,
        riskLevel: 'LOW',
        lastTransactionDate: new Date(Date.now() - 86400000 * 2).toISOString(),
        transactions: [
          { id: 'tx-1', date: '2026-10-18', type: 'DUE_SALE', amount: 3500, balance: 3500, note: 'Paper reams & exam prints' },
          { id: 'tx-2', date: '2026-10-20', type: 'REPAYMENT', amount: 2050, balance: 1450, note: 'Cash payment by Headmaster' },
        ]
      },
      {
        id: '09886940-3514-4621-8041-ee39502d09d4',
        name: 'XYZ Small Business',
        phone: '0171677894',
        customerType: 'BUSINESS',
        dueAmount: 3200,
        creditLimit: 10000,
        daysOverdue: 35,
        riskLevel: 'MEDIUM',
        lastTransactionDate: new Date(Date.now() - 86400000 * 5).toISOString(),
        transactions: [
          { id: 'tx-3', date: '2026-09-15', type: 'DUE_SALE', amount: 3200, balance: 3200, note: 'Brochure color printing & lamination' }
        ]
      }
    ]
  });
}
