import { NextResponse } from 'next/server';
import { getValidBackendUrl } from '../../../../lib/utils';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { message: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    // Try to proxy to real backend if available
    const backendUrl = getValidBackendUrl();
    if (backendUrl) {
      try {
        const backendRes = await fetch(`${backendUrl}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
          signal: AbortSignal.timeout(2000)
        });

        const data = await backendRes.json().catch(() => null);
        if (backendRes.ok && data) {
          return NextResponse.json(data, { status: 200 });
        }
      } catch (backendErr) {
        console.warn("Backend not reachable for staff /api/auth/forgot-password", backendErr);
      }
    }

    // Generic success response to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been dispatched to your inbox.'
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Error processing password reset request' },
      { status: 500 }
    );
  }
}
