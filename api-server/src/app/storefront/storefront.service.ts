import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductsService } from '../business-core/services/products.service';
import { QuoteEngineService } from './quote-engine.service';
import { StorageService } from '../storage/storage.service';
import { SalesService } from '../sales/sales.service';
import { PrismaClientManager } from '../common/prisma/prisma-client.manager';
import { ProductType, ProductStatus, Prisma, PrismaClient } from '@prisma/client';
import { ProductCheckoutDto, ServiceCheckoutDto, ServiceQuoteDto, StorageUploadDto } from './storefront.dto';

@Injectable()
export class StorefrontService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly quoteEngine: QuoteEngineService,
    private readonly storageService: StorageService,
    private readonly salesService: SalesService,
    private readonly prismaManager: PrismaClientManager,
  ) {}

  async getDefaultOrganizationId(): Promise<string> {
    const prisma = this.prismaManager.client as PrismaClient;
    const org = await prisma.organization.findFirst();
    if (!org) {
      throw new NotFoundException('Storefront organization not configured.');
    }
    return org.id;
  }

  async getCatalogProducts(organizationId: string, filterDto: any) {
    return this.productsService.findAll(organizationId, {
      ...filterDto,
      type: ProductType.PRODUCT,
      status: ProductStatus.ACTIVE,
      isOnlineVisible: true,
    });
  }

  async getCatalogServices(organizationId: string, filterDto: any) {
    return this.productsService.findAll(organizationId, {
      ...filterDto,
      type: ProductType.SERVICE,
      status: ProductStatus.ACTIVE,
      isOnlineVisible: true,
    });
  }

  async search(organizationId: string, search: string, page: number = 1, limit: number = 20) {
    const results = await this.productsService.findAll(organizationId, {
      search,
      page,
      limit,
      status: ProductStatus.ACTIVE,
      isOnlineVisible: true,
    });

    return {
      items: results.items.map(item => ({
        ...item,
        discriminator: item.type === ProductType.SERVICE ? 'SERVICE' : 'PRODUCT',
      })),
      meta: results.meta,
    };
  }

  async quoteService(organizationId: string, serviceId: string, dto: ServiceQuoteDto) {
    // Find the primary variant (assuming service has one primary variant for now)
    const product = await this.productsService.findOne(organizationId, serviceId);
    if (!product) {
      throw new NotFoundException('Service not found');
    }
    if (product.type !== ProductType.SERVICE) {
      throw new BadRequestException('Requested item is not a service');
    }
    const variantId = product.variants?.[0]?.id;
    if (!variantId) {
      throw new BadRequestException('Service has no active variants');
    }

    return this.quoteEngine.calculateQuote(
      organizationId,
      serviceId,
      variantId,
      dto.configuration,
      dto.quantity || 1,
    );
  }

  async uploadStorage(organizationId: string, customerId: string, dto: StorageUploadDto) {
    const key = `uploads/${organizationId}/${customerId}/${Date.now()}_${dto.filename}`;
    
    return this.storageService.createUnattachedUpload(organizationId, {
      filename: dto.filename,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      storageKey: key,
      customerId,
      accessType: 'PRIVATE_CUSTOMER',
    });
  }

  async checkoutProduct(organizationId: string, customerId: string, dto: ProductCheckoutDto, userId: string) {
    const prisma = this.prismaManager.client as PrismaClient;
    
    // Resolve product variant to get price
    const variant = await prisma.productVariant.findFirst({
      where: {
        id: dto.variantId,
        organizationId,
        product: {
          type: ProductType.PRODUCT,
          status: ProductStatus.ACTIVE,
        }
      },
      include: { product: true }
    });

    if (!variant) {
      throw new BadRequestException('Product variant not found or not available');
    }

    // Use SalesService to create direct sale
    return this.salesService.createDirectSale(organizationId, {
      customerId,
      branchId: dto.branchId,
      warehouseId: dto.warehouseId,
      lines: [
        {
          variantId: variant.id,
          quantity: dto.quantity,
        }
      ]
    }, userId, { [variant.id]: variant.retailPrice.toNumber() });
  }

  async checkoutService(organizationId: string, customerId: string, dto: ServiceCheckoutDto, userId: string) {
    const prisma = this.prismaManager.client as PrismaClient;
    
    // Resolve variant
    const variant = await prisma.productVariant.findFirst({
      where: {
        id: dto.variantId,
        organizationId,
        product: {
          type: ProductType.SERVICE,
          status: ProductStatus.ACTIVE,
        }
      },
      include: { product: true }
    });

    if (!variant) {
      throw new BadRequestException('Service variant not found or not available');
    }

    // Recalculate Quote
    const quote = await this.quoteEngine.calculateQuote(
      organizationId,
      variant.productId,
      variant.id,
      dto.configuration,
      dto.quantity || 1
    );

    // Initial state
    const fulfillmentStatus = (dto.storageObjectIds && dto.storageObjectIds.length > 0) 
      ? 'QUEUED' 
      : 'PENDING_FILES';

    // We need a transaction to create the sale AND link the storage objects.
    // However, SalesService abstracts the Sale creation. 
    // We will create the sale, and then link storage objects.
    const sale = await this.salesService.createDirectSale(organizationId, {
      customerId,
      branchId: dto.branchId,
      warehouseId: dto.warehouseId, // Services might not need warehouse, but required by CreateSaleDto
      lines: [
        {
          variantId: variant.id,
          quantity: dto.quantity || 1,
          // Passing metadata through extra fields won't work out-of-the-box with SalesService without modifying it.
          // Wait, SalesService takes CreateSaleDto which might not have configurationSnapshot.
          // Let's modify the SaleLine after creation or modify SalesService.
        }
      ]
    }, userId, { [variant.id]: quote.finalUnitPrice.toNumber() });

    // After creating the sale, we update the SaleLine with our service fields.
    const saleLine = sale.lines.find(l => l.variantId === dto.variantId);
    if (saleLine) {
      await prisma.saleLine.update({
        where: { id: saleLine.id },
        data: {
          configurationSnapshot: quote.normalizedConfiguration,
          fulfillmentStatus: fulfillmentStatus,
        }
      });

      // Link StorageObjects
      if (dto.storageObjectIds && dto.storageObjectIds.length > 0) {
        for (const storageId of dto.storageObjectIds) {
          await this.storageService.attachToSaleLine(organizationId, storageId, saleLine.id);
        }
      }
    }

    return sale;
  }

  async customerAiAssistant(organizationId: string, message: string): Promise<{
    reply: string;
    recommendedProducts: Array<{
      id: string;
      name: string;
      price: number;
      compareAtPrice?: number;
      imageUrl?: string;
    }>;
    suggestedQuestions: string[];
    engineUsed: 'AI_GEMINI' | 'ALGORITHMIC_FALLBACK';
  }> {
    const prisma = this.prismaManager.client as PrismaClient;

    const products = await prisma.product.findMany({
      where: {
        organizationId,
        isActive: true,
        isOnlineVisible: true,
      },
      take: 30,
      select: {
        id: true,
        name: true,
        sellingPrice: true,
        compareAtPrice: true,
        imageUrl: true,
        description: true,
        isDropship: true,
      },
    });

    const defaultSuggestions = [
      '🛍️ সেরা অফার ও ট্রেন্ডিং প্রোডাক্ট দেখান',
      '🚚 ডেলিভারি চার্জ ও সময় কত?',
      '💵 ক্যাশ অন ডেলিভারি (COD) কি আছে?',
      '🔍 কীভাবে অর্ডার ট্র্যাক করবো?',
    ];

    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

    if (geminiApiKey && geminiApiKey.length > 5 && !geminiApiKey.includes('placeholder')) {
      try {
        const catalogSummary = products.map(p => 
          `- ID: "${p.id}", Name: "${p.name}", Price: ৳${Number(p.sellingPrice)}${p.compareAtPrice ? `, Regular: ৳${Number(p.compareAtPrice)}` : ''}`
        ).join('\n');

        const prompt = `You are a courteous, professional, and knowledgeable AI Shopping Assistant & Sales Concierge for an online storefront in Bangladesh.
Your goal is to assist customers, recommend products, and answer policy questions.

Store Knowledge & Policies:
- Cash on Delivery (COD): Available nationwide across all 64 districts in Bangladesh!
- Delivery Charge: Inside Dhaka ৳60–80 (24–48 hours), Outside Dhaka ৳120–150 (48–72 hours via Pathao/Steadfast).
- Guarantee: 7-day checking replacement warranty for any manufacturer defect.
- Payment Options: Cash on Delivery (COD), bKash, Nagad, and Visa/Mastercard.

Available Products in Catalog:
${catalogSummary}

Customer Inquiry: "${message}"

Instructions:
- Respond in warm, respectful Bengali (or English if the customer writes in English). Keep it brief, persuasive, and helpful (max 3-4 sentences).
- If the customer is inquiring about products, gifts, recommendations, or deals, pick 1 to 3 relevant product IDs from the Available Products list above.
- Provide 3 relevant follow-up questions for the customer.

Return STRICT JSON ONLY (no markdown blocks, no backticks, just raw json):
{
  "reply": "<warm, helpful response in Bengali/English>",
  "recommendedProductIds": ["<id1>", "<id2>"],
  "suggestedQuestions": ["<question 1 in Bengali>", "<question 2 in Bengali>", "<question 3 in Bengali>"]
}`;

        const model = 'gemini-3.5-flash-lite';
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);

        const aiRes = await fetch(endpoint, {
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
        clearTimeout(timer);

        if (aiRes.ok) {
          const json = await aiRes.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
            const recIds: string[] = Array.isArray(parsed.recommendedProductIds) ? parsed.recommendedProductIds : [];
            const matchedProducts = products
              .filter(p => recIds.includes(p.id))
              .map(p => ({
                id: p.id,
                name: p.name,
                price: Number(p.sellingPrice),
                compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
                imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop',
              }));

            return {
              reply: parsed.reply || 'স্বাগতম! আমি কীভাবে আপনাকে সাহায্য করতে পারি?',
              recommendedProducts: matchedProducts,
              suggestedQuestions: Array.isArray(parsed.suggestedQuestions) && parsed.suggestedQuestions.length > 0
                ? parsed.suggestedQuestions
                : defaultSuggestions,
              engineUsed: 'AI_GEMINI',
            };
          }
        }
      } catch (err: any) {
        console.warn(`Customer AI Assistant Gemini call failed: ${err.message}. Falling back.`);
      }
    }

    // Algorithmic Fallback Assistant
    const query = message.toLowerCase();
    let reply = 'স্বাগতম! আমাদের স্টোরে ক্যাশ অন ডেলিভারিতে সারাদেশে পণ্য ডেলিভারি দেওয়া হয় (ঢাকায় ২৪-৪৮ ঘণ্টা, ঢাকার বাইরে ৭২ ঘণ্টা)। আপনি কোন ধরনের পণ্য খুঁজছেন?';
    let matchedProducts = [];

    if (query.includes('ডেলিভারি') || query.includes('delivery') || query.includes('charge') || query.includes('চার্জ')) {
      reply = 'আমাদের ডেলিভারি চার্জ: ঢাকা সিটির ভেতরে ৳৭০ (২৪–৪৮ ঘণ্টার মধ্যে ডেলিভারি) এবং ঢাকা সিটির বাইরে সারাদেশে ৳১৩০ (৪৮–৭২ ঘণ্টার মধ্যে)। পণ্য হাতে পেয়ে চেক করে পেমেন্ট করার সুবিধা রয়েছে!';
    } else if (query.includes('ক্যাশ') || query.includes('cod') || query.includes('cash')) {
      reply = 'হ্যাঁ! আমাদের সকল প্রোডাক্টে সম্পূর্ণ ক্যাশ অন ডেলিভারি (Cash on Delivery) সুবিধা রয়েছে। সারাদেশে ডেলিভারি ম্যানের কাছ থেকে পার্সেল চেক করে টাকা পরিশোধ করতে পারবেন।';
    } else if (query.includes('ওয়ারেন্টি') || query.includes('warranty') || query.includes('রিটার্ন') || query.includes('গ্যারান্টি')) {
      reply = 'আমাদের প্রতিটি প্রোডাক্টে পাচ্ছেন ৭ দিনের চেকিং রিপ্লেসমেন্ট গ্যারান্টি। কোনো সমস্যা থাকলে সরাসরি পরিবর্তন বা সমাধান পাবেন।';
    } else {
      matchedProducts = products.filter(p => {
        const pName = p.name.toLowerCase();
        return query.split(' ').some(word => word.length > 2 && pName.includes(word));
      }).slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.sellingPrice),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
        imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop',
      }));

      if (matchedProducts.length > 0) {
        reply = `আপনার পছন্দের সাথে মিলিয়ে সেরা কিছু প্রোডাক্ট খুঁজে পেয়েছি। নিচে দেখতে পারেন:`;
      } else {
        matchedProducts = products.slice(0, 3).map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.sellingPrice),
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
          imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop',
        }));
        reply = `আমাদের স্টোরের বর্তমান হট ও ট্রেন্ডিং কালেকশন নিচে দেখতে পারেন। যেকোনো তথ্যে আমাকে জানাতে পারেন!`;
      }
    }

    return {
      reply,
      recommendedProducts: matchedProducts,
      suggestedQuestions: defaultSuggestions,
      engineUsed: 'ALGORITHMIC_FALLBACK',
    };
  }
}
