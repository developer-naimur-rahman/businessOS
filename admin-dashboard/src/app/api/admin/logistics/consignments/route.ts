import { NextResponse } from 'next/server';

let consignmentsStore = [
  {
    id: 'CN-1001',
    consignmentId: 'SF-99218274',
    courierProvider: 'STEADFAST',
    mode: 'EXPRESS_COD',
    recipientName: 'Kamal Hossain',
    recipientPhone: '01719887766',
    recipientAddress: 'Sector 3, Uttara, Dhaka',
    codAmount: 2450,
    status: 'IN_TRANSIT',
    bookedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'CN-1002',
    consignmentId: 'PT-88127391',
    courierProvider: 'PATHAO',
    mode: 'SAME_DAY',
    recipientName: 'Farhana Yeasmin',
    recipientPhone: '01611223399',
    recipientAddress: 'Dhanmondi 27, Dhaka',
    codAmount: 1600,
    status: 'DELIVERED',
    bookedAt: new Date(Date.now() - 172800000).toISOString()
  }
];

export async function GET() {
  return NextResponse.json(consignmentsStore);
}
