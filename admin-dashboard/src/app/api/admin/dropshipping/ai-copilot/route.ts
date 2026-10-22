import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const message = body.message || body.query || '';

  return NextResponse.json({
    reply: `আপনার বিজনেস অপারেটিং সিস্টেম প্রস্তুত। প্রশ্ন: "${message}"। ড্রপশিপিং অ্যানালাইসিস করতে কোনো প্রোডাক্টের নাম অথবা লিঙ্ক প্রদান করুন।`,
    actionType: 'NONE',
    actionData: null,
    suggestions: [
      'আজকের প্রফিট ও সেলস কত?',
      'ক্যাশ রেজিস্টার ব্যালেন্স কত আছে?',
      'নতুন ট্রেন্ডিং প্রোডাক্ট রিসার্চ করো',
      'ফেসবুক অ্যাডের বাংলা হুক লিখে দাও'
    ]
  });
}
