import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface LoyaltyRulesDto {
  earnRateSpentBdt?: number; // e.g. 100 BDT = 1 point
  redeemValueBdt?: number;   // e.g. 1 point = 1 BDT
  minimumRedeemPoints?: number; // e.g. 100 points
  welcomeBonusPoints?: number;  // e.g. 50 points
}

export interface AdjustPointsDto {
  customerId: string;
  pointsDelta: number; // positive to add, negative to deduct
  reason: string;
}

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getRules(organizationId: string): Promise<LoyaltyRulesDto> {
    const config = await this.prisma.storefrontConfig.findUnique({
      where: { organizationId },
    });
    const settings = (config?.globalSettings as any) || {};
    const loyalty = settings.loyalty || {};

    return {
      earnRateSpentBdt: loyalty.earnRateSpentBdt || 100,
      redeemValueBdt: loyalty.redeemValueBdt || 1,
      minimumRedeemPoints: loyalty.minimumRedeemPoints || 100,
      welcomeBonusPoints: loyalty.welcomeBonusPoints || 50,
    };
  }

  async saveRules(organizationId: string, dto: LoyaltyRulesDto) {
    const existing = await this.prisma.storefrontConfig.findUnique({
      where: { organizationId },
    });
    const globalSettings = (existing?.globalSettings as any) || {};
    globalSettings.loyalty = {
      ...globalSettings.loyalty,
      ...dto,
    };

    await this.prisma.storefrontConfig.upsert({
      where: { organizationId },
      create: { organizationId, globalSettings },
      update: { globalSettings },
    });

    return { success: true, message: 'Loyalty rules updated successfully', rules: dto };
  }

  private calculateTier(points: number): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' {
    if (points >= 5000) return 'PLATINUM';
    if (points >= 2000) return 'GOLD';
    if (points >= 500) return 'SILVER';
    return 'BRONZE';
  }

  async getCustomerWallets(organizationId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { organizationId },
      include: {
        sales: {
          select: { id: true, total: true, status: true },
        },
      },
    });

    const adjustLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'LoyaltyAdjustment',
      },
      orderBy: { createdAt: 'desc' },
    });

    const adjustByCust = new Map<string, number>();
    adjustLogs.forEach((l) => {
      const d = (l.newData as any) || {};
      const cId = d.customerId;
      const pts = Number(d.pointsDelta) || 0;
      adjustByCust.set(cId, (adjustByCust.get(cId) || 0) + pts);
    });

    const rules = await this.getRules(organizationId);
    const earnRate = rules.earnRateSpentBdt || 100;

    let tierCounts = { BRONZE: 0, SILVER: 0, GOLD: 0, PLATINUM: 0 };
    let totalPointsInCirculation = 0;

    const rows = customers.map((c) => {
      const salesTotal = c.sales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
      const earnedFromSales = Math.floor(salesTotal / earnRate);
      const manualAdj = adjustByCust.get(c.id) || 0;
      const currentPoints = Math.max(0, earnedFromSales + manualAdj);
      const tier = this.calculateTier(currentPoints);

      tierCounts[tier]++;
      totalPointsInCirculation += currentPoints;

      return {
        id: c.id,
        name: c.name,
        phone: c.phone || '01700000000',
        email: c.email || '',
        currentPoints,
        lifetimeEarned: earnedFromSales + Math.max(0, manualAdj),
        tier,
        tierBenefitText: tier === 'PLATINUM' ? 'VIP Priority + 10% Extra Cashback' : tier === 'GOLD' ? '5% Extra Benefit' : tier === 'SILVER' ? '2% Extra Benefit' : 'Standard Member',
        totalSpent: salesTotal,
      };
    });

    return {
      kpi: {
        totalPointsInCirculation,
        tierCounts,
        activeLoyaltyMembers: customers.length,
      },
      customers: rows.sort((a, b) => b.currentPoints - a.currentPoints),
    };
  }

  async adjustPoints(organizationId: string, userId: string | null, dto: AdjustPointsDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const logRecord = {
      customerId: dto.customerId,
      customerName: customer.name,
      pointsDelta: Number(dto.pointsDelta),
      reason: dto.reason || 'Manual Adjustment',
      adjustedAt: new Date().toISOString(),
    };

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'LoyaltyAdjustment',
        entityId: dto.customerId,
        action: 'ADJUST_LOYALTY_POINTS',
        newData: logRecord,
      },
    });

    return {
      success: true,
      message: `Adjusted ${dto.pointsDelta > 0 ? '+' : ''}${dto.pointsDelta} points for ${customer.name}`,
      adjustment: logRecord,
    };
  }

  async getRedeemQuote(organizationId: string, customerId: string, subtotalAmount: number) {
    const rules = await this.getRules(organizationId);
    const wallets = await this.getCustomerWallets(organizationId);
    const customer = wallets.customers.find((c) => c.id === customerId);

    const availablePoints = customer?.currentPoints || 0;
    const minPoints = rules.minimumRedeemPoints || 100;
    const pointValue = rules.redeemValueBdt || 1;

    if (availablePoints < minPoints) {
      return {
        eligible: false,
        message: `Minimum ${minPoints} points required to redeem (Customer has ${availablePoints} pts)`,
        availablePoints,
        discountBdt: 0,
      };
    }

    // Max 30% of subtotal can be redeemed via points
    const maxDiscountAllowed = Math.floor(subtotalAmount * 0.3);
    const pointsToDiscount = Math.min(availablePoints * pointValue, maxDiscountAllowed);
    const pointsUsed = Math.floor(pointsToDiscount / pointValue);

    return {
      eligible: true,
      availablePoints,
      pointsToRedeem: pointsUsed,
      discountAmountBdt: pointsToDiscount,
      remainingPoints: availablePoints - pointsUsed,
      message: `Redeeming ${pointsUsed} points gives ৳${pointsToDiscount} instant discount`,
    };
  }
}
