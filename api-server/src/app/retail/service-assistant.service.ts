import { Injectable, Logger } from '@nestjs/common';
import { ServiceKnowledgeService, InternetServiceDef } from './service-knowledge.service';

export interface AssistantQueryDto {
  query: string;
  serviceSlug?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; text: string }>;
}

export interface AssistantResponse {
  replyBn: string;
  replyEn?: string;
  matchedService?: {
    slug: string;
    titleBn: string;
    titleEn: string;
    officialFeeBdt: number;
    shopFeeBdt: number;
    photoSpecs?: any;
    requiredDocs: any[];
    checklist: string[];
  };
  recommendedAction: {
    type: 'START_REQUEST' | 'VIEW_REQUIREMENTS' | 'BOOK_APPOINTMENT' | 'CHECK_STATUS' | 'NONE';
    labelBn: string;
    url: string;
  };
  suggestedPrompts: string[];
  engineUsed: 'AI_GEMINI' | 'ALGORITHMIC_FALLBACK';
}

@Injectable()
export class ServiceAssistantService {
  private readonly logger = new Logger(ServiceAssistantService.name);

  constructor(private readonly knowledgeService: ServiceKnowledgeService) {}

  /**
   * Grounded AI assistant answering customer queries using strictly approved knowledge base
   */
  async answerCustomer(dto: AssistantQueryDto, organizationId?: string): Promise<AssistantResponse> {
    const rawQuery = (dto.query || '').trim();
    const queryLower = rawQuery.toLowerCase();

    // 1. Fetch approved services knowledge
    const allServices = await this.knowledgeService.getServices(organizationId);

    // 2. Determine best matched service
    let matched: InternetServiceDef | undefined;
    if (dto.serviceSlug) {
      matched = allServices.find(s => s.slug === dto.serviceSlug);
    }

    if (!matched) {
      // Find matching keywords
      if (queryLower.includes('পাসপোর্ট') || queryLower.includes('passport')) {
        matched = allServices.find(s => s.slug === 'e-passport-application');
      } else if (queryLower.includes('চাকরি') || queryLower.includes('job') || queryLower.includes('টেলিটক') || queryLower.includes('alljobs') || queryLower.includes('এডমিট') || queryLower.includes('admit')) {
        matched = allServices.find(s => s.slug === 'teletalk-govt-job');
      } else if (queryLower.includes('জন্ম') || queryLower.includes('birth') || queryLower.includes('bdris')) {
        matched = allServices.find(s => s.slug === 'birth-registration-correction');
      } else if (queryLower.includes('nid') || queryLower.includes('এনআইডি') || queryLower.includes('ভোটার') || queryLower.includes('আইডি কার্ড')) {
        matched = allServices.find(s => s.slug === 'nid-correction-reissue');
      } else if (queryLower.includes('ট্যাক্স') || queryLower.includes('tin') || queryLower.includes('টিআইএন') || queryLower.includes('আয়কর')) {
        matched = allServices.find(s => s.slug === 'tin-certificate-registration');
      } else if (queryLower.includes('ভিসা') || queryLower.includes('visa') || queryLower.includes('ইন্ডিয়ান') || queryLower.includes('ivac') || queryLower.includes('দুবাই')) {
        matched = allServices.find(s => s.slug === 'visa-document-preparation');
      } else if (queryLower.includes('ছবি') || queryLower.includes('photo') || queryLower.includes('রিসাইজ') || queryLower.includes('resize') || queryLower.includes('স্বাক্ষর') || queryLower.includes('signature')) {
        matched = allServices.find(s => s.slug === 'photo-resizing-printing');
      }
    }

    // Default suggestions
    const defaultPrompts = [
      'চাকরির আবেদনের ছবির সাইজ কত?',
      'জন্ম নিবন্ধনে নাম ভুল হলে কী কী লাগবে?',
      'ই-পাসপোর্টের সরকারি ফি কত?',
      'আজকে দোকানে আসতে অ্যাপয়েন্টমেন্ট কীভাবে নিব?',
    ];

    // Build grounding context from approved facts
    const groundingContext = allServices.map(s => `
Service: ${s.titleBn} (${s.titleEn})
Slug: ${s.slug}
Official Govt Fee: ৳${s.officialGovtFeeBdt}
Shop Service Charge: ৳${s.shopServiceChargeBdt}
Processing Time: ${s.estimatedProcessingTime}
Photo Specs: ${s.photoSpecs ? `${s.photoSpecs.widthPx}x${s.photoSpecs.heightPx} px, max ${s.photoSpecs.maxKb}KB, BG: ${s.photoSpecs.bgColor}` : 'None'}
Signature Specs: ${s.signatureSpecs ? `${s.signatureSpecs.widthPx}x${s.signatureSpecs.heightPx} px, max ${s.signatureSpecs.maxKb}KB` : 'None'}
Required Docs: ${s.requiredDocs.map(d => d.nameBn).join(', ')}
What to bring: ${s.whatToBringToShopBn.join(', ')}
Common Mistakes: ${s.commonMistakesBn.join(', ')}
Official Portal: ${s.officialSourceUrl} (${s.officialSourceTitle})
`).join('\n---\n');

    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

    if (geminiApiKey && geminiApiKey.length > 5 && !geminiApiKey.includes('placeholder')) {
      try {
        const prompt = `You are the official BusinessOS Internet Service Center & Smart Customer Service AI for our physical computer & internet service shop in Bangladesh.
You answer citizens in fluent, polite, crystal-clear Bengali (and English if requested).
IMPORTANT RULES:
1. ONLY use the verified facts provided below in the Grounding Context.
2. DO NOT invent or fabricate any fee, document requirement, or deadline. If not in the context, say it needs verification at our shop counter.
3. If the user mentions bringing some documents, clearly state what additional documents are still missing from the approved checklist.
4. Keep the answer concise (2-4 sentences max), informative, and encourage them to either start request online or book a shop visit.

Grounding Context (Approved Knowledge Base):
${groundingContext}

Matched Service Hint: ${matched ? matched.titleBn : 'None'}
Customer Message: "${rawQuery}"

Respond strictly in JSON format (no markdown, no backticks):
{
  "replyBn": "<Helpful, friendly answer in Bengali citing exact fees and required docs from context>",
  "matchedSlug": "<slug of the matched service from context, or null>",
  "recommendedActionType": "<START_REQUEST | VIEW_REQUIREMENTS | BOOK_APPOINTMENT | CHECK_STATUS | NONE>",
  "recommendedActionLabelBn": "<Button label in Bengali>",
  "suggestedPrompts": ["<follow up question 1>", "<follow up question 2>"]
}`;

        const model = 'gemini-3.5-flash-lite';
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 9000);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
          }),
        });
        clearTimeout(timeout);

        if (res.ok) {
          const json = await res.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
            const resolvedSlug = parsed.matchedSlug || matched?.slug;
            const finalMatched = allServices.find(s => s.slug === resolvedSlug) || matched;

            return {
              replyBn: parsed.replyBn,
              matchedService: finalMatched ? {
                slug: finalMatched.slug,
                titleBn: finalMatched.titleBn,
                titleEn: finalMatched.titleEn,
                officialFeeBdt: finalMatched.officialGovtFeeBdt,
                shopFeeBdt: finalMatched.shopServiceChargeBdt,
                photoSpecs: finalMatched.photoSpecs,
                requiredDocs: finalMatched.requiredDocs,
                checklist: finalMatched.checklistItemsBn,
              } : undefined,
              recommendedAction: {
                type: (parsed.recommendedActionType as any) || 'VIEW_REQUIREMENTS',
                labelBn: parsed.recommendedActionLabelBn || 'প্রয়োজনীয় তথ্য ও গাইড দেখুন',
                url: finalMatched ? `/service-helper?service=${finalMatched.slug}` : '/services',
              },
              suggestedPrompts: Array.isArray(parsed.suggestedPrompts) && parsed.suggestedPrompts.length > 0
                ? parsed.suggestedPrompts
                : defaultPrompts,
              engineUsed: 'AI_GEMINI',
            };
          }
        }
      } catch (e: any) {
        this.logger.warn(`Gemini Assistant failed: ${e.message}. Using algorithmic fallback.`);
      }
    }

    // Algorithmic Fallback Grounded Engine
    if (matched) {
      const docList = matched.requiredDocs.map(d => d.nameBn).join(', ');
      let photoNotice = '';
      if (matched.photoSpecs) {
        photoNotice = ` ছবির সাইজ: ${matched.photoSpecs.widthPx}x${matched.photoSpecs.heightPx} পিক্সেল (সর্বোচ্চ ${matched.photoSpecs.maxKb} KB)।`;
      }

      const reply = `${matched.titleBn}-এর জন্য আপনার যা যা লাগবে: ${docList}।${photoNotice} সরকারি ফি: ৳${matched.officialGovtFeeBdt.toLocaleString()} এবং আমাদের কম্পিউটার প্রসেসিং ফি: ৳${matched.shopServiceChargeBdt}। আপনি এখনই অনলাইন পোর্টালে তথ্য আপলোড করে রিকোয়েস্ট সাবমিট করতে পারেন অথবা দোকানে আসার সময় নির্ধারণ করতে পারেন।`;

      return {
        replyBn: reply,
        matchedService: {
          slug: matched.slug,
          titleBn: matched.titleBn,
          titleEn: matched.titleEn,
          officialFeeBdt: matched.officialGovtFeeBdt,
          shopFeeBdt: matched.shopServiceChargeBdt,
          photoSpecs: matched.photoSpecs,
          requiredDocs: matched.requiredDocs,
          checklist: matched.checklistItemsBn,
        },
        recommendedAction: {
          type: 'VIEW_REQUIREMENTS',
          labelBn: `${matched.titleBn} গাইড ও আবেদন`,
          url: `/service-helper?service=${matched.slug}`,
        },
        suggestedPrompts: [
          `${matched.titleBn}-এর জন্য দোকানে কী আনতে হবে?`,
          `আজকে অ্যাপয়েন্টমেন্ট বুকিং করতে চাই`,
          `আমার আবেদন ট্র্যাক করব কীভাবে?`,
        ],
        engineUsed: 'ALGORITHMIC_FALLBACK',
      };
    }

    return {
      replyBn: `স্বাগতম! আমাদের ইন্টারনেট সার্ভিস সেন্টারে আপনি সরকারি ও বেসরকারি চাকরির আবেদন, ই-পাসপোর্ট, জন্ম নিবন্ধন সংশোধন, NID সংশোধন, ই-টিআইএন ও ছবি রিসাইজ সেবা নির্ভুলভাবে সম্পন্ন করতে পারবেন। আপনি কোন সেবা সম্পর্কে জানতে চান?`,
      recommendedAction: {
        type: 'VIEW_REQUIREMENTS',
        labelBn: 'সকল সেবার তালিকা দেখুন',
        url: '/services',
      },
      suggestedPrompts: defaultPrompts,
      engineUsed: 'ALGORITHMIC_FALLBACK',
    };
  }
}
