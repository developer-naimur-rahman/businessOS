import { NextResponse } from 'next/server';
import { demoStore } from '../../../../../lib/demo-backend-store';
import { getValidBackendUrl } from '../../../../../lib/utils';

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const query = (body.query || body.message || '').trim();
  if (!query) {
    return NextResponse.json({ message: 'Query string is required' }, { status: 400 });
  }

  const authHeader = req.headers.get('authorization') || '';
  const backendUrl = getValidBackendUrl();

  // 1. If backend server is available, attempt proxy
  if (backendUrl && authHeader) {
    try {
      const res = await fetch(`${backendUrl}/api/admin/ai-copilot/ask`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback
    }
  }

  // 2. Gather Business Snapshot from demoStore
  const jobs = demoStore.getServiceJobs();
  const apps = demoStore.getServiceApplications();
  const prints = demoStore.getPrintQueue();
  const sales = demoStore.getSalesHistory();
  const expenses = demoStore.getExpenses();
  const register = demoStore.getCashRegisterSummary();
  const baki = demoStore.getBakiLedger();

  const todayRevenueBdt = sales.reduce((sum: number, s: any) => sum + Number(s.grandTotal || s.total || 0), 0);
  const pendingJobsCount = jobs.filter((j: any) => j.status !== 'DELIVERED_PAID' && j.status !== 'CANCELLED').length;
  const pendingAppsCount = apps.filter((a: any) => a.status !== 'COMPLETED' && a.status !== 'DELIVERED' && a.status !== 'CANCELLED').length;
  const waitingForDocsCount = apps.filter((a: any) => a.status === 'SUBMITTED_FOR_REVIEW' || a.status === 'DRAFT').length;
  const waitingForPaymentCount = apps.filter((a: any) => a.paymentStatus === 'UNPAID').length;
  const pendingPrintsCount = prints.filter((p: any) => p.status !== 'READY_FOR_PICKUP').length;
  const totalBakiDueBdt = baki.totalDueBdt || 1500;
  const totalExpensesBdt = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

  const snapshot = {
    todaySales: todayRevenueBdt,
    todaySalesCount: sales.length,
    todayRevenueBdt,
    monthlyRevenueBdt: todayRevenueBdt * 15,
    grossProfit: Math.round(todayRevenueBdt * 0.35),
    salesCount: sales.length,
    lowStockCount: 2,
    lowStockSummary: 'A4 Printing Paper (Ream), 64GB Pendrive stock low',
    totalBakiDueBdt,
    totalExpensesBdt,
    cashInDrawer: register.cashInDrawer || 5000,
    topDebtors: 'Md. Al-Amin (৳1,500), Rafiqul Islam (৳850)',
    pendingJobsCount,
    pendingPrintsCount,
    pendingAppsCount,
    waitingForDocsCount,
    waitingForPaymentCount,
    todayAppointments: 3,
    tomorrowAppointments: 2
  };

  const defaultSuggestions = [
    '📊 আজকের মোট সেলস ও ক্যাশ কত?',
    '📒 টপ বাকি কাস্টমারদের লিস্ট দাও',
    '⚠️ কোন কোন প্রোডাক্টের স্টক শেষ?',
    '🛠️ কয়টা সার্ভিস জব পেন্ডিং আছে?',
    '💡 ব্যবসার লাভ বাড়াতে পরামর্শ দাও'
  ];

  let replyText = '';
  let actionType = 'NONE';
  let engine = 'ALGORITHMIC_COPILOT';
  let engineLabel = 'BusinessOS Smart Rule Engine';

  // 3. Attempt Google Gemini AI if API Key exists
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiApiKey && geminiApiKey.length > 5) {
    try {
      const prompt = `You are BusinessOS AI Copilot, the AI brain of an IT, digital service & retail center in Bangladesh.
Store Snapshot:
- Today's Sales: ৳${todayRevenueBdt.toLocaleString()} (${sales.length} transactions)
- Cash in Till: ৳${snapshot.cashInDrawer.toLocaleString()}
- Total Baki (Customer Due): ৳${totalBakiDueBdt.toLocaleString()} (Top debtors: ${snapshot.topDebtors})
- Pending Service / Repair Jobs: ${pendingJobsCount}
- Active Internet / Citizen Applications: ${pendingAppsCount} (Waiting for verification: ${waitingForDocsCount})
- Print Queue Pending: ${pendingPrintsCount}
- Low Stock Items: ${snapshot.lowStockSummary}

User Query: "${query}"

Instructions:
1. Provide a direct, professional, and friendly answer in Bengali (বাংলা).
2. Keep it concise (2-4 sentences max) with actionable insights.
3. Suggest the most relevant actionType:
   - "VIEW_FINANCE" (for revenue, profits, balance)
   - "VIEW_POS" (for sales, billing, products)
   - "VIEW_REGISTER" (for till cash, register)
   - "VIEW_SERVICE_APPLICATIONS" (for jobs, government applications, citizens)
   - "VIEW_BAKI" (for customer credit, dues)
   - "NONE" (general)

Output STRICT JSON ONLY (no markdown blocks):
{
  "reply": "<your Bengali reply>",
  "actionType": "<actionType>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (geminiRes.ok) {
        const json = await geminiRes.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
          if (parsed.reply) {
            replyText = parsed.reply;
            actionType = parsed.actionType || 'NONE';
            engine = 'AI_GEMINI';
            engineLabel = 'Google Gemini 2.5 Flash AI';
          }
        }
      }
    } catch {
      // Gemini failed, seamlessly fall back to algorithmic engine
    }
  }

  // 4. Algorithmic Fallback Engine (Runs if Gemini is offline or not configured)
  if (!replyText) {
    const q = query.toLowerCase();

    if (q.includes('সেলস') || q.includes('বিক্রি') || q.includes('বিক্রয়') || q.includes('আজকের') || q.includes('sales') || q.includes('revenue')) {
      replyText = `আজকের দিনে মোট ${sales.length}টি বিক্রয় সম্পন্ন হয়েছে এবং সর্বমোট সেলস এসেছে ৳${todayRevenueBdt.toLocaleString()}। ক্যাশ ড্রয়ারে বর্তমানে ৳${snapshot.cashInDrawer.toLocaleString()} রয়েছে।`;
      actionType = 'VIEW_FINANCE';
    } else if (q.includes('বাকি') || q.includes('খাতা') || q.includes('due') || q.includes('baki') || q.includes('কাস্টমার')) {
      replyText = `বর্তমানে কাস্টমারদের কাছে মোট বাকি রয়েছে ৳${totalBakiDueBdt.toLocaleString()}। সর্বোচ্চ বকেয়া তালিকা: ${snapshot.topDebtors}। আপনি বাকি খাতা থেকে এসএমএস রিমাইন্ডার পাঠাতে পারেন।`;
      actionType = 'VIEW_BAKI';
    } else if (q.includes('সার্ভিস') || q.includes('মেরামত') || q.includes('ল্যাপটপ') || q.includes('পিসি') || q.includes('repair') || q.includes('job')) {
      replyText = `বর্তমানে মোট ${pendingJobsCount}টি হার্ডওয়্যার সার্ভিস ও মেরামত জব সক্রিয় রয়েছে। ১টি ডিভাইস ডেলিভারির জন্য প্রস্তুত রয়েছে।`;
      actionType = 'VIEW_SERVICE_APPLICATIONS';
    } else if (q.includes('আবেদন') || q.includes('কাগজ') || q.includes('ডকুমেন্ট') || q.includes('চাকরি') || q.includes('application')) {
      replyText = `মোট ${pendingAppsCount}টি অনলাইন সিটিজেন আবেদন প্রক্রিয়াধীন। এর মধ্যে ${waitingForDocsCount}টি আবেদনের প্রয়োজনীয় ডকুমেন্টস যাচাইয়ের অপেক্ষায় আছে।`;
      actionType = 'VIEW_SERVICE_APPLICATIONS';
    } else if (q.includes('স্টক') || q.includes('মজুদ') || q.includes('stock') || q.includes('পণ্য')) {
      replyText = `সতর্কতা: ${snapshot.lowStockSummary}-এর স্টক সীমিত (৫টির নিচে)। নতুন পারচেজ অর্ডার তৈরি করার পরামর্শ দেওয়া হচ্ছে।`;
      actionType = 'VIEW_POS';
    } else if (q.includes('প্রিন্ট') || q.includes('print') || q.includes('ফাইল')) {
      replyText = `প্রিন্ট কিউতে ${pendingPrintsCount}টি ফাইল প্রিন্ট হওয়ার অপেক্ষায় আছে। দ্রুত প্রিন্ট দিয়ে গ্রাহকের টোকেন সম্পন্ন করুন।`;
      actionType = 'VIEW_SERVICE_APPLICATIONS';
    } else if (q.includes('লাভ') || q.includes('profit') || q.includes('পরামর্শ')) {
      replyText = `আজ আনুমানিক গ্রস প্রফিট ৳${snapshot.grossProfit.toLocaleString()} (মার্জিন ~৩৫%)। লাভ বাড়াতে ডিজিটাল চাকরির আবেদন ও ফটো প্রিন্ট সার্ভিসের মতো উচ্চ মার্জিনের সেবায় জোর দিন এবং বাকি কাস্টমারদের তাগাদা দিন।`;
      actionType = 'VIEW_FINANCE';
    } else {
      replyText = `আমি আপনার বিজনেস কো-পাইলট। আজ দোকানে মোট ৳${todayRevenueBdt.toLocaleString()} বিক্রি হয়েছে, ${pendingJobsCount}টি সার্ভিস জব চলছে এবং বাকি রয়েছে ৳${totalBakiDueBdt.toLocaleString()}। কীভাবে সহায়তা করতে পারি?`;
      actionType = 'NONE';
    }
  }

  return NextResponse.json({
    engine,
    engineLabel,
    query,
    answer: replyText,
    reply: replyText,
    actionType,
    suggestions: defaultSuggestions,
    metricsSnapshot: snapshot,
    quickActions: [
      { label: 'সার্ভিস জব পাইপলাইন', href: '/admin/service-jobs' },
      { label: 'রিটেইল পিওএস (POS)', href: '/admin/pos' },
      { label: 'ডিজিটাল বাকি খাতা', href: '/admin/baki-khata' },
      { label: 'ক্যাশ রেজিস্টার', href: '/admin/cash-register' },
      { label: 'লাভ-ক্ষতি ও ফিন্যান্স', href: '/admin/finance/profit-loss' }
    ]
  });
}
