import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface IngestSocialLeadDto {
  sourceChannel: 'FB_INBOX' | 'FB_COMMENT' | 'IG_DM' | 'WHATSAPP';
  rawCustomerText: string;
  customerName?: string;
  customerPhone?: string;
  productSkuOrId?: string;
  postOrAdId?: string;
}

export interface ParsedOrderDetails {
  extractedName: string;
  extractedPhone: string;
  extractedAddress: string;
  detectedZone: 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA';
  quantity: number;
  productHint?: string;
  estimatedDeliveryCharge: number;
  confidenceScore: number;
  engineUsed: 'AI_GEMINI' | 'REGEX_RULE_ENGINE';
}

@Injectable()
export class SocialCommerceService {
  private readonly logger = new Logger(SocialCommerceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async parseMessage(organizationId: string, rawText: string): Promise<ParsedOrderDetails> {
    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

    // 1. Try Google Gemini API if key is available
    if (geminiApiKey && geminiApiKey.length > 5 && !geminiApiKey.includes('placeholder')) {
      try {
        const prompt = `You are an expert Bangladeshi e-commerce message parser.
Extract customer order details from this unstructured Facebook / Messenger message:
"${rawText}"

Extract:
- recipientName (person name)
- recipientPhone (e.g. 017..., 018..., 019...)
- recipientAddress (detailed address with thana/area/district)
- zone: "INSIDE_DHAKA" if in Dhaka city, else "OUTSIDE_DHAKA"
- quantity: integer (default 1)
- productHint: string of product/item mentioned

Return STRICT JSON ONLY (no markdown blocks, no backticks):
{
  "extractedName": "<name or Unknown>",
  "extractedPhone": "<phone or empty>",
  "extractedAddress": "<address or empty>",
  "detectedZone": "INSIDE_DHAKA" | "OUTSIDE_DHAKA",
  "quantity": 1,
  "productHint": "<item mentioned>",
  "confidenceScore": 95
}`;

        const model = 'gemini-3.5-flash-lite';
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);

        const aiRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
          }),
        });
        clearTimeout(timer);

        if (aiRes.ok) {
          const json = await aiRes.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
            const zone = parsed.detectedZone === 'OUTSIDE_DHAKA' ? 'OUTSIDE_DHAKA' : 'INSIDE_DHAKA';
            return {
              extractedName: parsed.extractedName || 'Customer',
              extractedPhone: parsed.extractedPhone || '',
              extractedAddress: parsed.extractedAddress || '',
              detectedZone: zone,
              quantity: Number(parsed.quantity) || 1,
              productHint: parsed.productHint || '',
              estimatedDeliveryCharge: zone === 'INSIDE_DHAKA' ? 70 : 130,
              confidenceScore: Number(parsed.confidenceScore) || 90,
              engineUsed: 'AI_GEMINI',
            };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Social message parsing Gemini call failed: ${err.message}. Running rule engine.`);
      }
    }

    // 2. High-Precision Regex & BD Rule-Based Engine
    const text = rawText || '';

    // BD Phone Regex: 013, 014, 015, 016, 017, 018, 019 + 8 digits
    const phoneMatch = text.match(/(?:\+88|88)?01[3-9]\d{8}/);
    const extractedPhone = phoneMatch ? phoneMatch[0].replace(/^(?:\+88|88)/, '') : '';

    // Dhaka detection keywords
    const dhakaKeywords = ['dhaka', 'মিরপুর', 'mirpur', 'উত্তরা', 'uttara', 'ধানমন্ডি', 'dhanmondi', 'মোহাম্মদপুর', 'gulshan', 'banani', 'গুলশান', 'বনানী', 'ঢাকা', 'badda', 'বাড্ডা', 'motijheel', 'মতিঝিল', 'jatrabari', 'যাত্রাবাড়ী'];
    const lower = text.toLowerCase();
    const isDhaka = dhakaKeywords.some(kw => lower.includes(kw));
    const detectedZone = isDhaka ? 'INSIDE_DHAKA' : 'OUTSIDE_DHAKA';

    // Quantity extraction
    let quantity = 1;
    const qtyMatch = text.match(/(\d+)\s*(?:টা|টি|piece|pcs|ta|ti|টা লাগবে)/i);
    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1], 10);
    }

    // Name extraction heuristic
    let extractedName = 'Customer';
    const nameMatch = text.match(/(?:নাম|name|amar nam|আমার নাম)[:\s]+([^\n,।0-9]+)/i);
    if (nameMatch) {
      extractedName = nameMatch[1].trim();
    }

    // Clean address heuristic
    let extractedAddress = text
      .replace(phoneMatch ? phoneMatch[0] : '', '')
      .replace(/(?:নাম|name)[:\s]+[^\n,।0-9]+/i, '')
      .trim();

    if (extractedAddress.length > 120) {
      extractedAddress = extractedAddress.substring(0, 120) + '...';
    }

    return {
      extractedName: extractedName || 'Customer',
      extractedPhone,
      extractedAddress: extractedAddress || text,
      detectedZone,
      quantity,
      estimatedDeliveryCharge: detectedZone === 'INSIDE_DHAKA' ? 70 : 130,
      confidenceScore: extractedPhone ? 85 : 60,
      engineUsed: 'REGEX_RULE_ENGINE',
    };
  }

  async ingestLead(organizationId: string, userId: string | null, dto: IngestSocialLeadDto) {
    const parsed = await this.parseMessage(organizationId, dto.rawCustomerText);

    const leadRecord = {
      leadId: `LEAD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sourceChannel: dto.sourceChannel,
      rawCustomerText: dto.rawCustomerText,
      customerName: dto.customerName || parsed.extractedName,
      customerPhone: dto.customerPhone || parsed.extractedPhone,
      productSkuOrId: dto.productSkuOrId || parsed.productHint,
      postOrAdId: dto.postOrAdId || null,
      parsedDetails: parsed,
      status: 'NEW_LEAD',
      createdAt: new Date().toISOString(),
    };

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'SocialLead',
        entityId: leadRecord.leadId,
        action: 'INGEST_SOCIAL_LEAD',
        newData: leadRecord as any,
      },
    });

    return {
      success: true,
      message: 'Social lead ingested successfully',
      lead: leadRecord,
    };
  }

  async getLeads(organizationId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'SocialLead',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return logs.map((log) => {
      const data = (log.newData as any) || {};
      return {
        id: log.id,
        leadId: log.entityId,
        sourceChannel: data.sourceChannel || 'FB_INBOX',
        rawCustomerText: data.rawCustomerText || '',
        customerName: data.customerName || 'Customer',
        customerPhone: data.customerPhone || '',
        productSkuOrId: data.productSkuOrId || '',
        status: data.status || 'NEW_LEAD',
        parsedDetails: data.parsedDetails,
        createdAt: data.createdAt || log.createdAt.toISOString(),
      };
    });
  }

  async convertToOrder(
    organizationId: string, 
    userId: string | null, 
    body: {
      leadId: string;
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      productId?: string;
      quantity?: number;
      deliveryCharge?: number;
      unitPrice?: number;
    }
  ) {
    // 1. Find or create Customer
    let customer = await this.prisma.customer.findFirst({
      where: {
        organizationId,
        phone: body.customerPhone,
      },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          organizationId,
          name: body.customerName || 'Social Commerce Customer',
          phone: body.customerPhone,
          address: body.customerAddress,
          status: 'ACTIVE',
        },
      });
    }

    // 2. Fetch or pick default branch & warehouse
    const branch = await this.prisma.branch.findFirst({
      where: { organizationId },
    });
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { organizationId },
    });

    if (!branch || !warehouse) {
      throw new Error('Default branch or warehouse not configured for this organization');
    }

    // 3. Find Product Variant or use default
    let variant: any = null;
    let unitPrice = body.unitPrice || 1200;
    let productName = 'Social Commerce Order Item';

    if (body.productId) {
      variant = await this.prisma.productVariant.findFirst({
        where: { organizationId, productId: body.productId },
        include: { product: true },
      });
      if (variant) {
        unitPrice = Number(variant.price) || unitPrice;
        productName = variant.product?.name || productName;
      }
    }

    if (!variant) {
      variant = await this.prisma.productVariant.findFirst({
        where: { organizationId },
        include: { product: true },
      });
    }

    const qty = body.quantity || 1;
    const deliveryCharge = body.deliveryCharge !== undefined ? body.deliveryCharge : 70;
    const subtotal = unitPrice * qty;
    const total = subtotal + deliveryCharge;
    const saleNumber = `SO-${Date.now().toString().slice(-6)}`;

    // 4. Create central Sale
    const sale = await this.prisma.sale.create({
      data: {
        organizationId,
        branchId: branch.id,
        warehouseId: warehouse.id,
        customerId: customer.id,
        status: 'CONFIRMED' as any,
        paymentStatus: 'UNPAID',
        saleNumber,
        subtotal,
        total,
        saleDate: new Date(),
        createdByUserId: userId || undefined,
        lines: {
          create: {
            organizationId,
            variantId: variant?.id || 'var-123',
            quantity: qty,
            unitPrice,
            lineSubtotal: subtotal,
            lineTotal: subtotal,
            productNameSnapshot: productName,
            skuSnapshot: variant?.sku || 'SOC-SKU',
          },
        },
      },
    });

    // 5. Update lead status in AuditLog
    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'SocialLead',
        entityId: body.leadId,
        action: 'CONVERT_TO_ORDER',
        newData: {
          convertedSaleId: sale.id,
          saleNumber: sale.saleNumber,
          totalAmount: total,
          status: 'CONVERTED_TO_ORDER',
          convertedAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: `Social lead successfully converted to Central Order #${sale.saleNumber}`,
      saleId: sale.id,
      saleNumber: sale.saleNumber,
      totalAmount: total,
    };
  }
}
