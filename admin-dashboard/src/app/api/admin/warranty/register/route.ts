import { NextResponse } from 'next/server';
import { addWarrantyRecord } from '../../../../../lib/warranty-store';

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const durationDays = Number(body.warrantyDurationDays || 365);
  const purchaseDate = body.purchaseDate || new Date().toISOString().slice(0, 10);
  const expiryDate = new Date(Date.now() + durationDays * 86400000).toISOString().slice(0, 10);

  const newRecord = {
    id: `w-${Date.now()}`,
    serialNumber: body.serialNumber || `SN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    productName: body.productName || 'Hardware Product',
    sku: body.sku || 'HW-GEN-01',
    customerName: body.customerName || 'Walk-in Customer',
    customerPhone: body.customerPhone || '',
    supplierName: body.supplierName || 'Star Tech / UCC',
    purchaseDate,
    warrantyDurationDays: durationDays,
    warrantyExpiryDate: expiryDate,
    daysRemaining: durationDays,
    status: 'ACTIVE',
    invoiceNumber: body.invoiceNumber || ''
  };

  addWarrantyRecord(newRecord);

  return NextResponse.json({
    success: true,
    message: 'হার্ডওয়্যার ও ওয়ারেন্টি সফলভাবে নিবন্ধিত হয়েছে।',
    warranty: newRecord
  }, { status: 201 });
}
