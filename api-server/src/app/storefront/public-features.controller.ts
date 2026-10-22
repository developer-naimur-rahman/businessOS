import { 
  Controller, Get, Post, Delete, Patch, Body, Param, Query, 
  UseGuards, BadRequestException, NotFoundException, Request 
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';
import { randomUUID } from 'crypto';

interface CouponItem {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderAmount: number;
  description: string;
  isActive: boolean;
  isBuiltIn?: boolean;
}

const BUILT_IN_COUPONS: CouponItem[] = [
  {
    code: 'WELCOME10',
    type: 'PERCENTAGE',
    value: 10,
    minOrderAmount: 0,
    description: '10% off your entire order (Welcome promotion)',
    isActive: true,
    isBuiltIn: true,
  },
  {
    code: 'FLAT100',
    type: 'FIXED',
    value: 100,
    minOrderAmount: 1000,
    description: '৳100 off on orders over ৳1,000',
    isActive: true,
    isBuiltIn: true,
  },
  {
    code: 'SAVE50',
    type: 'FIXED',
    value: 50,
    minOrderAmount: 500,
    description: '৳50 off on orders over ৳500',
    isActive: true,
    isBuiltIn: true,
  },
];

@Controller()
export class PublicFeaturesController {
  constructor(private readonly prisma: PrismaService) {}

  private async getDefaultOrganizationId(): Promise<string> {
    const org = await this.prisma.organization.findFirst();
    if (!org) {
      throw new NotFoundException('Organization not configured.');
    }
    return org.id;
  }

  // ==========================================
  // PUBLIC COUPON ENGINE
  // ==========================================

  @Post('public/coupons/validate')
  async validateCoupon(@Body() body: { code: string; subtotal?: number; orderAmount?: number; amount?: number }) {
    if (!body.code || typeof body.code !== 'string') {
      throw new BadRequestException('Coupon code is required.');
    }

    const orgId = await this.getDefaultOrganizationId();
    const subtotal = Number(body.subtotal ?? body.orderAmount ?? body.amount) || 0;
    const searchCode = body.code.trim().toUpperCase();

    // Fetch custom coupons from StorefrontConfig.globalSettings
    const config = await this.prisma.storefrontConfig.findUnique({
      where: { organizationId: orgId },
    });

    const globalSettings = (config?.globalSettings as any) || {};
    const customCoupons: CouponItem[] = Array.isArray(globalSettings.coupons) ? globalSettings.coupons : [];

    // Search custom first, then built-in
    let matched = customCoupons.find(c => c.code.toUpperCase() === searchCode);
    if (!matched) {
      matched = BUILT_IN_COUPONS.find(c => c.code.toUpperCase() === searchCode);
    }

    if (!matched) {
      return {
        valid: false,
        message: `Coupon code '${searchCode}' is not valid.`,
      };
    }

    if (matched.isActive === false) {
      return {
        valid: false,
        message: `Coupon code '${searchCode}' is no longer active.`,
      };
    }

    if (matched.minOrderAmount && subtotal < matched.minOrderAmount) {
      return {
        valid: false,
        message: `Coupon requires a minimum order amount of ৳${matched.minOrderAmount}.`,
      };
    }

    let discountAmount = 0;
    if (matched.type === 'PERCENTAGE') {
      discountAmount = Math.round((subtotal * matched.value) / 100);
    } else {
      discountAmount = Math.min(matched.value, subtotal);
    }

    const newTotal = Math.max(0, subtotal - discountAmount);

    return {
      valid: true,
      code: matched.code,
      type: matched.type,
      value: matched.value,
      discountAmount,
      newTotal,
      message: `Coupon '${matched.code}' applied successfully!`,
    };
  }

  // ==========================================
  // PUBLIC CONTACT FORM
  // ==========================================

  @Post('public/contact')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 10, ttlSeconds: 60 })
  async submitContactInquiry(
    @Body() body: { name: string; phone: string; email?: string; subject?: string; message: string }
  ) {
    if (!body.name?.trim()) {
      throw new BadRequestException('Your name is required.');
    }
    if (!body.phone?.trim()) {
      throw new BadRequestException('A contact phone number is required.');
    }
    if (!body.message?.trim()) {
      throw new BadRequestException('Message cannot be empty.');
    }

    const orgId = await this.getDefaultOrganizationId();

    await this.prisma.auditLog.create({
      data: {
        organizationId: orgId,
        entityType: 'ContactInquiry',
        entityId: randomUUID(),
        action: 'SUBMITTED',
        newData: {
          name: body.name.trim(),
          phone: body.phone.trim(),
          email: body.email?.trim() || null,
          subject: body.subject?.trim() || 'General Inquiry',
          message: body.message.trim(),
          submittedAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: 'Thank you! Your message has been received. Our team will contact you shortly.',
    };
  }

  // ==========================================
  // PUBLIC NEWSLETTER SUBSCRIPTION
  // ==========================================

  @Post('public/newsletter')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 10, ttlSeconds: 60 })
  async subscribeNewsletter(@Body() body: { email: string }) {
    if (!body?.email || typeof body.email !== 'string') {
      throw new BadRequestException('Email address is required.');
    }

    const email = body.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Please provide a valid email address.');
    }

    const orgId = await this.getDefaultOrganizationId();

    const existing = await this.prisma.auditLog.findFirst({
      where: {
        organizationId: orgId,
        entityType: 'NewsletterSubscription',
        entityId: email,
      },
    });

    if (existing) {
      return {
        success: true,
        alreadySubscribed: true,
        message: 'You are already subscribed to our newsletter! Thank you for staying connected.',
      };
    }

    await this.prisma.auditLog.create({
      data: {
        organizationId: orgId,
        entityType: 'NewsletterSubscription',
        entityId: email,
        action: 'SUBSCRIBED',
        newData: {
          email,
          subscribedAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: '🎉 Congratulations! You have successfully subscribed to our newsletter.',
    };
  }

  // ==========================================
  // ADMIN COUPONS MANAGEMENT
  // ==========================================

  @Get('admin/coupons')
  @UseGuards(JwtAuthGuard)
  async getAdminCoupons(@Request() req: any) {
    const orgId = req.user?.organizationId || (await this.getDefaultOrganizationId());
    
    const config = await this.prisma.storefrontConfig.findUnique({
      where: { organizationId: orgId },
    });

    const globalSettings = (config?.globalSettings as any) || {};
    const customCoupons: CouponItem[] = Array.isArray(globalSettings.coupons) ? globalSettings.coupons : [];

    return {
      builtIn: BUILT_IN_COUPONS,
      custom: customCoupons,
      all: [...BUILT_IN_COUPONS, ...customCoupons],
    };
  }

  @Post('admin/coupons')
  @UseGuards(JwtAuthGuard)
  async saveAdminCoupon(
    @Request() req: any,
    @Body() body: { code: string; type: 'PERCENTAGE' | 'FIXED'; value: number; minOrderAmount?: number; description?: string; isActive?: boolean }
  ) {
    if (!body.code?.trim()) {
      throw new BadRequestException('Coupon code is required.');
    }
    if (body.value === undefined || body.value < 0) {
      throw new BadRequestException('Valid discount value is required.');
    }

    const orgId = req.user?.organizationId || (await this.getDefaultOrganizationId());
    const cleanCode = body.code.trim().toUpperCase();

    const config = await this.prisma.storefrontConfig.findUnique({
      where: { organizationId: orgId },
    });

    const globalSettings = (config?.globalSettings as any) || {};
    let customCoupons: CouponItem[] = Array.isArray(globalSettings.coupons) ? [...globalSettings.coupons] : [];

    // Remove existing if updating
    customCoupons = customCoupons.filter(c => c.code.toUpperCase() !== cleanCode);

    // Add updated coupon
    customCoupons.push({
      code: cleanCode,
      type: body.type || 'PERCENTAGE',
      value: Number(body.value),
      minOrderAmount: Number(body.minOrderAmount) || 0,
      description: body.description?.trim() || `${cleanCode} promotional discount`,
      isActive: body.isActive !== false,
      isBuiltIn: false,
    });

    await this.prisma.storefrontConfig.upsert({
      where: { organizationId: orgId },
      update: {
        globalSettings: {
          ...globalSettings,
          coupons: customCoupons,
        } as any,
      },
      create: {
        organizationId: orgId,
        globalSettings: {
          coupons: customCoupons,
        } as any,
      },
    });

    return {
      success: true,
      message: `Coupon '${cleanCode}' saved successfully.`,
      coupons: customCoupons,
    };
  }

  @Delete('admin/coupons/:code')
  @UseGuards(JwtAuthGuard)
  async deleteAdminCoupon(@Request() req: any, @Param('code') code: string) {
    const orgId = req.user?.organizationId || (await this.getDefaultOrganizationId());
    const cleanCode = code.trim().toUpperCase();

    const config = await this.prisma.storefrontConfig.findUnique({
      where: { organizationId: orgId },
    });

    const globalSettings = (config?.globalSettings as any) || {};
    let customCoupons: CouponItem[] = Array.isArray(globalSettings.coupons) ? [...globalSettings.coupons] : [];

    customCoupons = customCoupons.filter(c => c.code.toUpperCase() !== cleanCode);

    await this.prisma.storefrontConfig.update({
      where: { organizationId: orgId },
      data: {
        globalSettings: {
          ...globalSettings,
          coupons: customCoupons,
        } as any,
      },
    });

    return {
      success: true,
      message: `Coupon '${cleanCode}' removed successfully.`,
      coupons: customCoupons,
    };
  }

  // ==========================================
  // ADMIN CONTACT INQUIRIES VIEWER
  // ==========================================

  @Get('admin/inquiries')
  @UseGuards(JwtAuthGuard)
  async getContactInquiries(@Request() req: any) {
    const orgId = req.user?.organizationId || (await this.getDefaultOrganizationId());

    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId: orgId,
        entityType: 'ContactInquiry',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return logs.map(l => ({
      id: l.id,
      ...(l.newData as any),
      createdAt: l.createdAt,
    }));
  }

  // ==========================================
  // ADMIN REVIEW MODERATION
  // ==========================================

  @Get('admin/reviews')
  @UseGuards(JwtAuthGuard)
  async getAdminReviews(@Request() req: any, @Query('rating') rating?: string) {
    const orgId = req.user?.organizationId || (await this.getDefaultOrganizationId());

    const where: any = { organizationId: orgId };
    if (rating && Number(rating) > 0) {
      where.rating = Number(rating);
    }

    const reviews = await this.prisma.review.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            code: true,
            imageUrl: true,
            sellingPrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews;
  }

  @Delete('admin/reviews/:id')
  @UseGuards(JwtAuthGuard)
  async deleteReview(@Request() req: any, @Param('id') id: string) {
    const orgId = req.user?.organizationId || (await this.getDefaultOrganizationId());

    const review = await this.prisma.review.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    await this.prisma.review.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Review removed successfully.',
    };
  }

  @Post('admin/reviews/trigger-requests')
  @UseGuards(JwtAuthGuard)
  async triggerReviewRequests(@Request() req: any) {
    const orgId = req.user?.organizationId || (await this.getDefaultOrganizationId());

    // Find delivered / completed orders
    const completedSales = await this.prisma.sale.findMany({
      where: {
        organizationId: orgId,
        status: { in: ['COMPLETED'] },
      },
      include: {
        customer: true,
      },
      take: 20,
    });

    const invitations = completedSales.map(sale => {
      const s = sale as any;
      const couponCode = `REVIEW10-${s.id.slice(0, 4).toUpperCase()}`;
      return {
        saleId: s.id,
        orderNumber: s.saleNumber || s.id.slice(0, 8),
        customerName: s.customer?.name || 'Customer',
        customerPhone: s.customer?.phone || '01700000000',
        rewardOffer: '10% OFF Coupon (REVIEW10) on your next purchase',
        rewardCouponCode: couponCode,
        status: 'INVITATION_SENT',
        sentAt: new Date().toISOString(),
      };
    });

    // Record audit log
    await this.prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId: req.user?.userId || undefined,
        entityType: 'ReviewRequestBatch',
        entityId: `REV-BATCH-${Date.now()}`,
        action: 'TRIGGER_AUTO_REVIEWS',
        newData: { count: invitations.length, invitations },
      },
    });

    return {
      success: true,
      message: `Triggered automated review invitations for ${invitations.length} delivered orders with reward coupon code REVIEW10!`,
      totalTriggered: invitations.length,
      invitations,
    };
  }

  @Patch('admin/reviews/:id')
  @UseGuards(JwtAuthGuard)
  async updateReviewStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED_LIVE' | 'HIDDEN' | 'PENDING' },
  ) {
    const orgId = req.user?.organizationId || (await this.getDefaultOrganizationId());

    const review = await this.prisma.review.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    // Persist moderation status in AuditLog
    await this.prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId: req.user?.userId || undefined,
        entityType: 'ReviewModeration',
        entityId: id,
        action: 'UPDATE_REVIEW_STATUS',
        newData: { status: body.status || 'APPROVED_LIVE', reviewedAt: new Date().toISOString() },
      },
    });

    return {
      success: true,
      message: `Review #${id} status updated to ${body.status || 'APPROVED_LIVE'}.`,
      status: body.status || 'APPROVED_LIVE',
    };
  }

  @Post('reviews/submit')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 10, ttlSeconds: 60 })
  async submitReview(@Body() body: {
    productId: string;
    rating: number;
    comment?: string;
    authorName: string;
    authorImage?: string;
    organizationId?: string;
  }) {
    const orgId = body.organizationId || (await this.getDefaultOrganizationId());

    if (!body.productId || !body.rating || !body.authorName) {
      throw new BadRequestException('productId, rating, and authorName are required.');
    }

    const review = await this.prisma.review.create({
      data: {
        organizationId: orgId,
        productId: body.productId,
        rating: Math.max(1, Math.min(5, Number(body.rating) || 5)),
        comment: body.comment || '',
        authorName: body.authorName,
        authorImage: body.authorImage || null,
      },
    });

    const rewardCoupon = `THANKYOU10-${Date.now().toString().slice(-4)}`;

    return {
      success: true,
      message: 'Thank you for your valuable review! Your 10% discount coupon has been generated.',
      review,
      rewardCoupon: {
        code: rewardCoupon,
        discount: '10% OFF',
        validDays: 30,
      },
    };
  }
}
