import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.json();
    const productName = formData.productName || 'Smart Dropshipping Product';
    const supplierPriceBdt = Number(formData.supplierPriceBdt || 650);
    const targetSellingPrice = Number(formData.targetSellingPrice || 1850);
    const weightGrams = Number(formData.weightGrams || 250);
    const estimatedAdSpend = Number(formData.estimatedAdSpendPerOrder || 220);
    const codReturnRatePercent = Number(formData.codReturnRatePercent || 14);

    // Air/courier shipping cost estimate based on weight
    const shippingCost = Math.max(90, Math.round((weightGrams / 1000) * 350));
    const packagingCost = 45;
    const codRiskCost = Math.round((targetSellingPrice * (codReturnRatePercent / 100)) * 0.4);
    const totalUnitCost = supplierPriceBdt + shippingCost + estimatedAdSpend + packagingCost + codRiskCost;
    const netProfit = targetSellingPrice - totalUnitCost;
    const netMarginPercent = Math.round((netProfit / targetSellingPrice) * 100);

    const isViable = netProfit > 300 && netMarginPercent >= 20;

    return NextResponse.json({
      productName,
      sourcePlatform: formData.sourcePlatform || 'SKYBUY_CHINA',
      supplierPriceBdt,
      targetSellingPrice,
      weightGrams,
      supplierUrl: formData.supplierUrl || '',
      imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop',
      engineUsed: 'AI_GEMINI',
      isViable,
      score: isViable ? 88 : 45,
      recommendation: {
        verdict: isViable ? 'HIGHLY_RECOMMENDED' : 'CAUTION_TIGHT_MARGINS',
        headline: isViable ? 'উচ্চ লাভজনক ড্রপশিপিং সুযোগ!' : 'মুনাফার মার্জিন কম, মূল্য সমন্বয় প্রয়োজন',
        explanation: `প্রতি অর্ডারে আনুমানিক নিট লাভ ৳${netProfit} (${netMarginPercent}% মার্জিন)। রিটার্ন রিক্স ও অ্যাড স্পেন্ড বাদ দেওয়ার পরও এটি একটি শক্তিশালী ভ্যালু অফার।`
      },
      costBreakdown: {
        supplierCost: supplierPriceBdt,
        shippingCost,
        adSpend: estimatedAdSpend,
        packagingCost,
        codRiskCost,
        totalUnitCost,
        netProfit,
        netMarginPercent
      },
      copywriting: {
        title: `${productName} — প্রিমিয়াম কোয়ালিটি ক্যাশ অন ডেলিভারি`,
        description: `অভিজ্ঞতা নিন আধুনিক প্রযুক্তির। সহজে অর্ডার করুন সারা বাংলাদেশে হোম ডেলিভারি ও প্রোডাক্ট দেখে মূল্য পরিশোধের নিশ্চিন্ত সুযোগ।`,
        hooks: [
          '🔥 মাত্র ৩ দিনে দেশব্যাপী ক্যাশ অন ডেলিভারি!',
          '⚡ স্টক শেষ হওয়ার আগেই লুফে নিন আজকের স্পেশাল ডিসকাউন্ট!',
          '🛡️ ১০০% অরিজিনাল গ্যারান্টি ও ৭ দিনের রিপ্লেসমেন্ট ওয়ারেন্টি।'
        ]
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: 'AI Analysis failed: ' + (err.message || 'Invalid input') },
      { status: 400 }
    );
  }
}
