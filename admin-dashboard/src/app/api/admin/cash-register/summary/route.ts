import { NextResponse } from 'next/server';
import { demoStore } from '../../../../../lib/demo-backend-store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  return NextResponse.json({
    date,
    openingBalance: demoStore.store.cashRegister.openingBalance,
    totalCashSales: 3500,
    totalCashIn: 500,
    totalCashOut: 1200,
    expectedCashInDrawer: demoStore.store.cashRegister.openingBalance + 3500 + 500 - 1200,
    isClosed: demoStore.store.cashRegister.isClosed,
    transactions: [
      { id: 'ctx-1', type: 'OPENING_FLOAT', amount: demoStore.store.cashRegister.openingBalance, time: '09:00 AM', notes: 'Morning opening drawer float' },
      { id: 'ctx-2', type: 'SALE_CASH', amount: 1250, time: '11:15 AM', notes: 'Invoice INV-2026-1042' },
      { id: 'ctx-3', type: 'EXPENSE_CASH', amount: 1200, time: '02:30 PM', notes: 'Shop cleaning & supplies' },
      { id: 'ctx-4', type: 'CASH_IN', amount: 500, time: '04:10 PM', notes: 'Advance payment for Job #1001' }
    ]
  });
}
