import { Injectable, Logger } from '@nestjs/common';

export interface AnalyzeProductInput {
  productName: string;
  sourcePlatform: 'SKYBUY_CHINA' | 'RESELLING_BD' | 'ALIEXPRESS' | 'LOCAL_WHOLESALE';
  supplierPriceBdt: number;
  weightGrams?: number;
  targetSellingPrice: number;
  categoryHint?: string;
  estimatedAdSpendPerOrder?: number;
  codReturnRatePercent?: number;
  supplierUrl?: string;
  imageUrl?: string;
}

export interface UnitEconomicsResult {
  supplierCost: number;
  airCargoFee: number;
  shippingCost: number;
  packagingCost: number;
  gatewayFee: number;
  adSpend: number;
  returnRiskCost: number;
  totalLandedCost: number;
  netProfit: number;
  profitMargin: number;
  breakEvenSellingPrice: number;
  recommendedSellingPrice: number;
  breakEvenRoas: number;
  deliveryDaysText: string;
}

export interface HybridAnalysisResult {
  id: string;
  productName: string;
  sourcePlatform: string;
  supplierUrl: string;
  supplierPriceBdt: number;
  weightGrams: number;
  targetSellingPrice: number;
  categoryHint: string;
  imageUrl: string;
  engineUsed: 'AI_GEMINI' | 'ALGORITHMIC_FALLBACK';
  score: number;
  verdict: string;
  verdictLevel: 'WINNER' | 'PROMISING' | 'AVOID';
  deliveryDaysText: string;
  costBreakdown: {
    supplierCost: number;
    airCargoFee: number;
    shippingCost: number;
    packagingCost: number;
    gatewayFee: number;
    adSpend: number;
    returnRiskCost: number;
    totalLandedCost: number;
  };
  profitability: {
    netProfit: number;
    profitMargin: number;
    breakEvenSellingPrice: number;
    recommendedSellingPrice: number;
    breakEvenRoas: number;
  };
  strengths: string[];
  risks: string[];
  targetAudience: string;
  copywriting: {
    seoTitle: string;
    description: string;
    fbAdHookBangla: string;
    fbAdHookEnglish: string;
  };
  importStatus: string;
  analyzedAt: string;
}

@Injectable()
export class HybridIntelligenceService {
  private readonly logger = new Logger(HybridIntelligenceService.name);

  /**
   * Calculate granular True Landed Cost and Unit Economics for Bangladesh e-commerce
   */
  calculateUnitEconomics(input: AnalyzeProductInput): UnitEconomicsResult {
    const {
      sourcePlatform,
      supplierPriceBdt,
      weightGrams = 250,
      targetSellingPrice,
      estimatedAdSpendPerOrder = 200,
      codReturnRatePercent = 15,
    } = input;

    let shippingCost = 100;
    let cargoFee = 0;
    let deliveryDaysText = '24–48 Hours across Bangladesh';

    if (sourcePlatform === 'SKYBUY_CHINA') {
      // Skybuy China air cargo ~850 BDT/kg, min 150 BDT
      cargoFee = Math.max(150, Math.round((weightGrams / 1000) * 850));
      shippingCost = cargoFee + 100; // Skybuy Air Cargo + Local Courier
      deliveryDaysText = '7–10 Business Days via Skybuy Air Cargo';
    } else if (sourcePlatform === 'ALIEXPRESS') {
      cargoFee = Math.max(250, Math.round((weightGrams / 1000) * 1100));
      shippingCost = cargoFee + 100;
      deliveryDaysText = '12–18 Days via AliExpress Standard Shipping';
    } else if (sourcePlatform === 'RESELLING_BD') {
      cargoFee = 60; // Local wholesale sorting & handling
      shippingCost = 100; // Standard BD courier
      deliveryDaysText = '24–48 Hours inside Dhaka / 72 Hours nationwide';
    } else {
      cargoFee = 40;
      shippingCost = 90;
      deliveryDaysText = '24–48 Hours across Bangladesh';
    }

    const packagingCost = 35; // Bubble wrap, poly mailer, branded sticker
    const gatewayFee = Math.round(targetSellingPrice * 0.015); // 1.5% COD / digital gateway fee
    const adSpend = Math.max(50, Number(estimatedAdSpendPerOrder) || 200);

    // In Bangladesh, returned COD parcels incur 2-way courier charge (~130 BDT) + 50% wasted ad spend
    const returnRiskCost = Math.round(
      ((codReturnRatePercent / 100) * 130) + 
      (adSpend * (codReturnRatePercent / 100) * 0.5)
    );

    const totalLandedCost = supplierPriceBdt + shippingCost + packagingCost + gatewayFee + returnRiskCost + adSpend;
    const netProfit = targetSellingPrice - totalLandedCost;
    const profitMargin = targetSellingPrice > 0 ? Number(((netProfit / targetSellingPrice) * 100).toFixed(1)) : 0;

    const fixedCostsExcludingGateway = supplierPriceBdt + shippingCost + packagingCost + returnRiskCost + adSpend;
    const breakEvenSellingPrice = Math.round(fixedCostsExcludingGateway / (1 - 0.015));
    const recommendedSellingPrice = Math.round(fixedCostsExcludingGateway / (1 - 0.015 - 0.35));

    const grossMarginAfterSourcing = targetSellingPrice - (supplierPriceBdt + shippingCost + packagingCost + gatewayFee + returnRiskCost);
    const breakEvenRoas = grossMarginAfterSourcing > 0 
      ? Number((targetSellingPrice / grossMarginAfterSourcing).toFixed(2)) 
      : 0;

    return {
      supplierCost: supplierPriceBdt,
      airCargoFee: cargoFee,
      shippingCost,
      packagingCost,
      gatewayFee,
      adSpend,
      returnRiskCost,
      totalLandedCost,
      netProfit,
      profitMargin,
      breakEvenSellingPrice,
      recommendedSellingPrice,
      breakEvenRoas,
      deliveryDaysText,
    };
  }

  /**
   * Main Hybrid Product Analyzer
   * Tries Google Gemini API first; falls back seamlessly to Algorithmic Engine on failure/missing key.
   */
  async analyze(input: AnalyzeProductInput): Promise<HybridAnalysisResult> {
    const economics = this.calculateUnitEconomics(input);
    const id = 'res-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const defaultImage = input.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop';

    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

    if (geminiApiKey && geminiApiKey.length > 5 && !geminiApiKey.includes('placeholder')) {
      try {
        const geminiResult = await this.callGeminiApi(input, economics, geminiApiKey);
        if (geminiResult) {
          return {
            id,
            productName: input.productName,
            sourcePlatform: input.sourcePlatform,
            supplierUrl: input.supplierUrl || '',
            supplierPriceBdt: input.supplierPriceBdt,
            weightGrams: input.weightGrams || 250,
            targetSellingPrice: input.targetSellingPrice,
            categoryHint: input.categoryHint || 'General',
            imageUrl: defaultImage,
            engineUsed: 'AI_GEMINI',
            score: geminiResult.score,
            verdict: geminiResult.verdict,
            verdictLevel: geminiResult.verdictLevel,
            deliveryDaysText: economics.deliveryDaysText,
            costBreakdown: {
              supplierCost: economics.supplierCost,
              airCargoFee: economics.airCargoFee,
              shippingCost: economics.shippingCost,
              packagingCost: economics.packagingCost,
              gatewayFee: economics.gatewayFee,
              adSpend: economics.adSpend,
              returnRiskCost: economics.returnRiskCost,
              totalLandedCost: economics.totalLandedCost,
            },
            profitability: {
              netProfit: economics.netProfit,
              profitMargin: economics.profitMargin,
              breakEvenSellingPrice: economics.breakEvenSellingPrice,
              recommendedSellingPrice: economics.recommendedSellingPrice,
              breakEvenRoas: economics.breakEvenRoas,
            },
            strengths: geminiResult.strengths,
            risks: geminiResult.risks,
            targetAudience: geminiResult.targetAudience,
            copywriting: geminiResult.copywriting,
            importStatus: 'WATCHLIST',
            analyzedAt: new Date().toISOString(),
          };
        }
      } catch (err: any) {
        this.logger.warn(`Google Gemini API execution failed: ${err?.message || err}. Seamlessly falling back to Algorithmic Engine.`);
      }
    } else {
      this.logger.debug('GEMINI_API_KEY not configured or empty. Using Algorithmic Fallback Engine.');
    }

    // Algorithmic Fallback Execution
    return this.runAlgorithmicEngine(input, economics, id, defaultImage);
  }

  /**
   * Google Gemini REST API caller with 8-second timeout
   */
  private async callGeminiApi(
    input: AnalyzeProductInput, 
    economics: UnitEconomicsResult, 
    apiKey: string
  ): Promise<{
    score: number;
    verdict: string;
    verdictLevel: 'WINNER' | 'PROMISING' | 'AVOID';
    strengths: string[];
    risks: string[];
    targetAudience: string;
    copywriting: {
      seoTitle: string;
      description: string;
      fbAdHookBangla: string;
      fbAdHookEnglish: string;
    };
  } | null> {
    const prompt = `You are a top-tier retail e-commerce dropshipping analyst specializing in the Bangladesh consumer market.
Analyze this product for dropshipping in Bangladesh:
- Product Name: "${input.productName}"
- Sourcing Platform: ${input.sourcePlatform}
- Sourcing Wholesale Price: ৳${input.supplierPriceBdt} BDT
- Target Retail Price: ৳${input.targetSellingPrice} BDT
- Calculated Total Landed Cost: ৳${economics.totalLandedCost} BDT
- Estimated Net Profit: ৳${economics.netProfit} BDT (Net Margin: ${economics.profitMargin}%)
- Parcel Weight: ${input.weightGrams || 250} grams
- Shipping & Courier Overhead: ৳${economics.shippingCost} BDT
- COD Return Risk Buffer: ৳${economics.returnRiskCost} BDT

Output STRICT JSON ONLY (do not include markdown ticks, no backticks, just raw json):
{
  "aiViabilityScore": 88,
  "verdictLevel": "WINNER",
  "verdict": "🔥 WINNING PRODUCT (Scale Immediately)",
  "strengths": [
    "High net cash margin of ${economics.profitMargin}% protects against ad cost fluctuations.",
    "Popular lifestyle demand in Bangladesh urban hubs."
  ],
  "risks": [
    "Strict COD verification recommended to maintain under 15% return rate."
  ],
  "targetAudience": "Bangladeshi urban shoppers aged 20-38 across Dhaka, Chattogram and Sylhet.",
  "copywriting": {
    "seoTitle": "${input.productName} — Premium Quality | Best Price in Bangladesh",
    "description": "<h3>${input.productName}</h3><p>Get authentic quality, fast delivery across Bangladesh with nationwide Cash on Delivery.</p><ul><li>Premium Build Quality</li><li>Tested Before Dispatch</li><li>Nationwide Cash on Delivery</li><li>7-Day Replacement Guarantee</li></ul>",
    "fbAdHookBangla": "🔥 দারুণ অফার! প্রিমিয়াম ${input.productName} এখন পাচ্ছেন বিশেষ ছাড়ে। দ্রুত অর্ডার করতে এখনই মেসেজ বা অর্ডার করুন! 🚀",
    "fbAdHookEnglish": "Experience high quality with ${input.productName}. Fast Cash on Delivery across Bangladesh. Limited stock available!"
  }
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Empty response from Gemini API');
      }

      const parsed = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());

      const score = Math.max(10, Math.min(99, Number(parsed.aiViabilityScore) || 75));
      let verdictLevel: 'WINNER' | 'PROMISING' | 'AVOID' = 'PROMISING';
      let verdict = '⚡ PROMISING (Test with Small Budget)';

      if (score >= 80) {
        verdictLevel = 'WINNER';
        verdict = '🔥 WINNING PRODUCT (Scale Immediately)';
      } else if (score < 55) {
        verdictLevel = 'AVOID';
        verdict = '❌ HIGH RISK / LOW MARGIN (Avoid)';
      }

      return {
        score,
        verdict: parsed.verdict || verdict,
        verdictLevel: parsed.verdictLevel || verdictLevel,
        strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : [
          `Healthy net margin of ${economics.profitMargin}%.`,
          `High demand category for online buyers.`,
        ],
        risks: Array.isArray(parsed.risks) && parsed.risks.length > 0 ? parsed.risks : [
          `Manage COD returns with quick phone confirmation.`,
        ],
        targetAudience: parsed.targetAudience || 'Urban youth, tech enthusiasts and online shoppers across Bangladesh.',
        copywriting: {
          seoTitle: parsed.copywriting?.seoTitle || `${input.productName} — Best Price in Bangladesh`,
          description: parsed.copywriting?.description || `<p>Authentic ${input.productName} with Cash on Delivery nationwide.</p>`,
          fbAdHookBangla: parsed.copywriting?.fbAdHookBangla || `🔥 আকর্ষণীয় ছাড়ে ${input.productName} এখন সারাদেশে ক্যাশ অন ডেলিভারিতে পাওয়া যাচ্ছে!`,
          fbAdHookEnglish: parsed.copywriting?.fbAdHookEnglish || `Order authentic ${input.productName} with fast delivery and Cash on Delivery.`,
        },
      };
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  }

  /**
   * Deterministic Algorithmic Fallback Engine
   */
  private runAlgorithmicEngine(
    input: AnalyzeProductInput,
    economics: UnitEconomicsResult,
    id: string,
    imageUrl: string
  ): HybridAnalysisResult {
    const { profitMargin, netProfit, shippingCost, airCargoFee } = economics;
    const { productName, sourcePlatform, weightGrams = 250, targetSellingPrice, supplierPriceBdt, supplierUrl = '', categoryHint = 'General', codReturnRatePercent = 15 } = input;

    // 1. Deterministic Viability Score Calculation
    let score = 50;

    if (profitMargin >= 35) score += 25;
    else if (profitMargin >= 25) score += 18;
    else if (profitMargin >= 15) score += 8;
    else if (profitMargin < 10) score -= 20;

    if (netProfit >= 600) score += 15;
    else if (netProfit >= 400) score += 10;
    else if (netProfit >= 250) score += 5;
    else if (netProfit < 100) score -= 15;

    if (sourcePlatform === 'SKYBUY_CHINA' || sourcePlatform === 'ALIEXPRESS') {
      if (weightGrams <= 250) score += 8;
      else if (weightGrams > 700) score -= 14;
    } else {
      score += 5; // Local sourcing speed bonus
    }

    if (targetSellingPrice >= 950 && targetSellingPrice <= 2500) score += 8;
    else if (targetSellingPrice > 4000) score -= 6;

    score = Math.max(12, Math.min(98, Math.round(score)));

    let verdict = '❌ HIGH RISK / LOW MARGIN (Avoid)';
    let verdictLevel: 'WINNER' | 'PROMISING' | 'AVOID' = 'AVOID';
    if (score >= 80) {
      verdict = '🔥 WINNING PRODUCT (Scale Immediately)';
      verdictLevel = 'WINNER';
    } else if (score >= 55) {
      verdict = '⚡ PROMISING (Test with Small Budget)';
      verdictLevel = 'PROMISING';
    }

    // 2. Strengths and risks
    const strengths: string[] = [];
    const risks: string[] = [];

    if (profitMargin >= 25) strengths.push(`Healthy net margin of ${profitMargin}% accommodates ad fluctuations.`);
    if (netProfit >= 350) strengths.push(`Attractive cash profit of ৳${netProfit.toLocaleString()} per delivered parcel.`);
    if (weightGrams <= 300) strengths.push(`Lightweight parcel (${weightGrams}g) minimizes air freight overhead.`);
    if (sourcePlatform === 'RESELLING_BD') strengths.push('Fast 24–48h local sourcing reduces customer cancellation rates.');

    if (profitMargin < 18) risks.push(`Tight net margin (${profitMargin}%). High risk if Facebook CPM spikes.`);
    if (weightGrams > 600 && sourcePlatform === 'SKYBUY_CHINA') risks.push(`Heavy weight (${weightGrams}g) adds ৳${airCargoFee} to air freight.`);
    if (codReturnRatePercent > 18) risks.push(`High COD return rate (${codReturnRatePercent}%). Mandatory customer phone verification required.`);
    if (targetSellingPrice > 3500) risks.push('High price tag for impulse Facebook buyers. Offer partial advance payment to prevent return.');

    // 3. Templated High-Converting Copy
    const seoTitle = `${productName} — Premium Quality | Best Price in Bangladesh`;
    const description = `
<h3>${productName}</h3>
<p>Upgrade your day-to-day lifestyle with our premium <strong>${productName}</strong>. Sourced directly with high reliability and backed by full warranty inspection.</p>
<ul>
  <li><strong>Authentic Quality:</strong> Verified and tested before dispatch.</li>
  <li><strong>Safe Delivery:</strong> ${economics.deliveryDaysText}.</li>
  <li><strong>Payment Flexibility:</strong> Cash on Delivery (COD) available nationwide.</li>
  <li><strong>Hassle-Free Replacement:</strong> 7-day checking guarantee.</li>
</ul>
<p><em>Order now to get instant discounted delivery anywhere in Bangladesh!</em></p>
    `.trim();

    const fbAdHookBangla = `🔥 সীমিত সময়ের স্পেশাল অফার! প্রিমিয়াম ${productName} এখন পাচ্ছেন বিশেষ ছাড়ে। সরাসরি ক্যাশ অন ডেলিভারিতে নিতে এখনই অর্ডার করুন! 🚀`;
    const fbAdHookEnglish = `Looking for the best ${productName}? Get premium quality, unbeatable price & Cash on Delivery anywhere in Bangladesh. Order today before stock runs out!`;

    return {
      id,
      productName,
      sourcePlatform,
      supplierUrl,
      supplierPriceBdt,
      weightGrams,
      targetSellingPrice,
      categoryHint,
      imageUrl,
      engineUsed: 'ALGORITHMIC_FALLBACK',
      score,
      verdict,
      verdictLevel,
      deliveryDaysText: economics.deliveryDaysText,
      costBreakdown: {
        supplierCost: economics.supplierCost,
        airCargoFee: economics.airCargoFee,
        shippingCost: economics.shippingCost,
        packagingCost: economics.packagingCost,
        gatewayFee: economics.gatewayFee,
        adSpend: economics.adSpend,
        returnRiskCost: economics.returnRiskCost,
        totalLandedCost: economics.totalLandedCost,
      },
      profitability: {
        netProfit: economics.netProfit,
        profitMargin: economics.profitMargin,
        breakEvenSellingPrice: economics.breakEvenSellingPrice,
        recommendedSellingPrice: economics.recommendedSellingPrice,
        breakEvenRoas: economics.breakEvenRoas,
      },
      strengths,
      risks,
      targetAudience: 'Urban youth, tech enthusiasts and online shoppers (Age 20-38) across Dhaka, Chattogram, Sylhet.',
      copywriting: {
        seoTitle,
        description,
        fbAdHookBangla,
        fbAdHookEnglish,
      },
      importStatus: 'WATCHLIST',
      analyzedAt: new Date().toISOString(),
    };
  }
}
