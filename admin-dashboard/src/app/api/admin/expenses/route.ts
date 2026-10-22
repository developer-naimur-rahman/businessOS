import { NextResponse } from 'next/server';
import { demoStore } from '../../../../lib/demo-backend-store';

export async function GET() {
  const expenses = demoStore.store.expenses;
  let todayTotal = 0;
  let monthTotal = 0;
  const breakdown: Record<string, number> = {};

  expenses.forEach((e: any) => {
    const amt = Number(e.amount || 0);
    todayTotal += amt;
    monthTotal += amt;
    breakdown[e.category] = (breakdown[e.category] || 0) + amt;
  });

  return NextResponse.json({
    expenses,
    metrics: {
      todayTotal,
      monthTotal,
      totalCount: expenses.length,
      filteredCount: expenses.length,
      topCategory: 'SUPPLIES',
      categoryBreakdown: breakdown
    }
  });
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const newExp = {
    id: `exp-${Date.now()}`,
    expenseId: `EXP-2026-${Math.floor(100 + Math.random() * 900)}`,
    amount: Number(body.amount || 0),
    category: body.category || 'MISCELLANEOUS',
    paymentMethod: body.paymentMethod || 'CASH',
    description: body.description || '',
    receiptRef: body.receiptRef || '',
    branchName: 'Main Storefront',
    expenseDate: body.expenseDate || new Date().toISOString().split('T')[0],
    createdByName: 'Staff',
    createdAt: new Date().toISOString()
  };

  demoStore.store.expenses.unshift(newExp);
  return NextResponse.json(newExp, { status: 201 });
}
