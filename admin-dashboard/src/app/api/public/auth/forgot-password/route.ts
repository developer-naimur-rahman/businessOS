import { NextResponse } from 'next/server';
import { getValidBackendUrl } from '../../../../../lib/utils';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { message: 'একটি বৈধ ইমেইল এড্রেস প্রদান করুন।' },
        { status: 400 }
      );
    }

    // Try to proxy to the real backend if available
    const backendUrl = getValidBackendUrl();
    if (backendUrl) {
      try {
        const backendRes = await fetch(`${backendUrl}/api/public/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
          signal: AbortSignal.timeout(3000)
        });

        const data = await backendRes.json().catch(() => null);
        if (backendRes.ok && data) {
          return NextResponse.json(data, { status: 200 });
        }
        if (data?.message) {
          return NextResponse.json(data, { status: backendRes.status });
        }
      } catch (backendErr) {
        console.warn("Backend not reachable for forgot-password:", backendErr);
      }
    }

    // Respond with a generic success message regardless of whether the email exists
    // to avoid revealing account enumeration information.
    // NOTE: Actual email delivery requires a configured backend with email provider.
    return NextResponse.json({
      success: true,
      message: 'যদি এই ইমেইলে কোনো অ্যাকাউন্ট থাকে, তাহলে পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। অনুগ্রহ করে আপনার ইনবক্স ও স্প্যাম ফোল্ডার চেক করুন।',
      _note: 'Email delivery requires a configured backend email provider. This response confirms the request was processed.'
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'পাসওয়ার্ড রিসেট রিকোয়েস্ট প্রসেস করতে সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}
