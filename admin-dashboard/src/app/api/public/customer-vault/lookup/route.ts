import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone') || '';

  if (!phone || phone.length < 10) {
    return NextResponse.json({ found: false, message: 'Valid phone number required for vault lookup.' });
  }

  return NextResponse.json({
    found: true,
    requiresLogin: false,
    maskedName: 'Citizen Vault Account',
    hasSavedDocs: true,
    message: 'Customer Vault record detected for this contact.'
  });
}
