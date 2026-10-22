import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;

  return NextResponse.json({
    dropUrl: `${origin}/upload-print`,
    shopName: 'My Business OS Print Studio',
    instructions: 'Scan with smartphone camera to drop documents without USB pendrives',
    supportedFormats: ['PDF', 'JPG', 'PNG', 'DOCX'],
    maxFileSizeMb: 50
  });
}
