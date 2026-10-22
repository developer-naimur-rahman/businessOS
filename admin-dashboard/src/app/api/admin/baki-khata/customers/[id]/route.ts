import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const mockCustomers: Record<string, any> = {
    '01fbf875-ad53-4b76-9649-5ed88c1fb043': {
      id: '01fbf875-ad53-4b76-9649-5ed88c1fb043',
      name: 'Local High School',
      phone: '0171974862',
      customerType: 'BUSINESS',
      totalCreditBdt: 3500,
      totalPaidBdt: 2050,
      netDueBdt: 1450,
      creditLimit: 15000,
      statement: [
        { id: 'tx-1', date: '2026-10-18', type: 'DUE_SALE', amount: 3500, balance: 3500, note: 'Paper reams & exam prints' },
        { id: 'tx-2', date: '2026-10-20', type: 'REPAYMENT', amount: 2050, balance: 1450, note: 'Cash payment by Headmaster' },
      ]
    },
    '09886940-3514-4621-8041-ee39502d09d4': {
      id: '09886940-3514-4621-8041-ee39502d09d4',
      name: 'XYZ Small Business',
      phone: '0171677894',
      customerType: 'BUSINESS',
      totalCreditBdt: 3200,
      totalPaidBdt: 0,
      netDueBdt: 3200,
      creditLimit: 10000,
      statement: [
        { id: 'tx-3', date: '2026-09-15', type: 'DUE_SALE', amount: 3200, balance: 3200, note: 'Brochure color printing & lamination' }
      ]
    }
  };

  const customer = mockCustomers[id] || {
    id,
    name: 'Customer Account',
    phone: '01711223344',
    customerType: 'RETAIL',
    totalCreditBdt: 2500,
    totalPaidBdt: 1000,
    netDueBdt: 1500,
    creditLimit: 5000,
    statement: [
      { id: 'tx-gen-1', date: new Date().toISOString().slice(0, 10), type: 'DUE_SALE', amount: 2500, balance: 2500, note: 'Goods purchase' },
      { id: 'tx-gen-2', date: new Date().toISOString().slice(0, 10), type: 'REPAYMENT', amount: 1000, balance: 1500, note: 'Partial deposit' }
    ]
  };

  return NextResponse.json(customer);
}
