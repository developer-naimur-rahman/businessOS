import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export type DigitalWalletType = 
  | 'BKASH_AGENT'
  | 'NAGAD_AGENT'
  | 'ROCKET_AGENT'
  | 'FLEXILOAD_SIM'
  | 'POLY_BIDYUT_UTILITY'
  | 'PHYSICAL_CASH_DRAWER';

export type DigitalTransactionType =
  | 'MOBILE_RECHARGE'
  | 'MFS_CASH_IN'
  | 'MFS_CASH_OUT'
  | 'ELECTRICITY_UTILITY_BILL'
  | 'ONLINE_GOVT_APPLICATION';

export interface RecordDigitalTransactionDto {
  transactionType: DigitalTransactionType;
  wallet: DigitalWalletType;
  recipientPhoneOrAccount: string;
  customerName?: string;
  amountBdt: number;
  serviceChargeOrFeeBdt?: number;
  commissionEarnedBdt?: number;
  trxId?: string;
  notes?: string;
}

export interface AdjustFloatDto {
  wallet: DigitalWalletType;
  adjustmentType: 'DEPOSIT_ADD' | 'WITHDRAW_DEDUCT';
  amountBdt: number;
  sourceOrReason?: string;
}

@Injectable()
export class DigitalServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getFloatBalances(organizationId: string): Promise<Record<DigitalWalletType, number>> {
    const config = await this.prisma.storefrontConfig.findUnique({
      where: { organizationId }
    });

    const settings = (config?.globalSettings as any) || {};
    const defaultFloats: Record<DigitalWalletType, number> = {
      BKASH_AGENT: 25000,
      NAGAD_AGENT: 20000,
      ROCKET_AGENT: 10000,
      FLEXILOAD_SIM: 8000,
      POLY_BIDYUT_UTILITY: 15000,
      PHYSICAL_CASH_DRAWER: 35000
    };

    return {
      ...defaultFloats,
      ...(settings.digitalWalletFloats || {})
    };
  }

  private async saveFloatBalances(organizationId: string, balances: Record<DigitalWalletType, number>) {
    const config = await this.prisma.storefrontConfig.findUnique({
      where: { organizationId }
    });

    const settings = (config?.globalSettings as any) || {};
    const updatedSettings = {
      ...settings,
      digitalWalletFloats: balances,
      updatedAt: new Date().toISOString()
    };

    await this.prisma.storefrontConfig.upsert({
      where: { organizationId },
      create: {
        organizationId,
        globalSettings: updatedSettings
      },
      update: {
        globalSettings: updatedSettings
      }
    });
  }

  async getSummary(organizationId: string) {
    const balances = await this.getFloatBalances(organizationId);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'DigitalUtilityTransaction',
        createdAt: { gte: startOfToday }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    let todayVolumeBdt = 0;
    let todayCommissionsBdt = 0;
    let todayCount = logs.length;

    const transactions = logs.map(l => {
      const state = (l.newData as any) || {};
      const amount = Number(state.amountBdt || 0);
      const commission = Number(state.totalProfitEarnedBdt || 0);
      todayVolumeBdt += amount;
      todayCommissionsBdt += commission;

      return {
        id: l.id,
        createdAt: l.createdAt,
        ...state
      };
    });

    const totalDigitalFloatBdt = 
      balances.BKASH_AGENT + 
      balances.NAGAD_AGENT + 
      balances.ROCKET_AGENT + 
      balances.FLEXILOAD_SIM + 
      balances.POLY_BIDYUT_UTILITY;

    return {
      balances,
      metrics: {
        totalDigitalFloatBdt,
        cashDrawerBdt: balances.PHYSICAL_CASH_DRAWER,
        todayCount,
        todayVolumeBdt,
        todayCommissionsAndFeesBdt: todayCommissionsBdt
      },
      recentTransactions: transactions
    };
  }

  async adjustFloat(organizationId: string, userId: string | null, dto: AdjustFloatDto) {
    const amount = Number(dto.amountBdt);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be a positive number.');
    }

    const balances = await this.getFloatBalances(organizationId);
    const current = balances[dto.wallet] || 0;

    let updated = current;
    if (dto.adjustmentType === 'DEPOSIT_ADD') {
      updated += amount;
    } else {
      if (current < amount) {
        throw new BadRequestException(`Insufficient float in ${dto.wallet}. Current balance: ৳${current}`);
      }
      updated -= amount;
    }

    balances[dto.wallet] = updated;
    await this.saveFloatBalances(organizationId, balances);

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        action: `FLOAT_ADJUST_${dto.adjustmentType}`,
        entityType: 'DigitalWalletFloat',
        entityId: dto.wallet,
        oldData: { previousBalance: current },
        newData: {
          wallet: dto.wallet,
          adjustmentType: dto.adjustmentType,
          amount,
          newBalance: updated,
          sourceOrReason: dto.sourceOrReason || 'Manual adjustment'
        }
      }
    });

    return {
      success: true,
      wallet: dto.wallet,
      newBalance: updated,
      message: `Float balance updated successfully to ৳${updated.toLocaleString()}`
    };
  }

  async recordTransaction(organizationId: string, userId: string | null, dto: RecordDigitalTransactionDto) {
    const amount = Number(dto.amountBdt);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Transaction amount must be greater than zero.');
    }

    const serviceCharge = Number(dto.serviceChargeOrFeeBdt || 0);
    const commission = Number(dto.commissionEarnedBdt || 0);
    const totalProfitEarnedBdt = serviceCharge + commission;

    const balances = await this.getFloatBalances(organizationId);
    const walletBalance = balances[dto.wallet] || 0;
    const cashBalance = balances.PHYSICAL_CASH_DRAWER || 0;

    if (dto.transactionType === 'MFS_CASH_IN' || dto.transactionType === 'MOBILE_RECHARGE' || dto.transactionType === 'ELECTRICITY_UTILITY_BILL') {
      if (walletBalance < amount) {
        throw new BadRequestException(`Insufficient digital float in ${dto.wallet} (Available: ৳${walletBalance.toLocaleString()})`);
      }
      balances[dto.wallet] -= amount;
      balances.PHYSICAL_CASH_DRAWER += (amount + serviceCharge);
    } else if (dto.transactionType === 'MFS_CASH_OUT') {
      if (cashBalance < amount) {
        throw new BadRequestException(`Insufficient physical cash in drawer to pay customer (Available: ৳${cashBalance.toLocaleString()})`);
      }
      balances[dto.wallet] += (amount + commission);
      balances.PHYSICAL_CASH_DRAWER -= amount;
    } else if (dto.transactionType === 'ONLINE_GOVT_APPLICATION') {
      balances.PHYSICAL_CASH_DRAWER += (amount + serviceCharge);
    }

    await this.saveFloatBalances(organizationId, balances);

    const trxId = dto.trxId || `TX-${Date.now().toString().slice(-6)}`;
    const logPayload = {
      trxId,
      transactionType: dto.transactionType,
      wallet: dto.wallet,
      recipientPhoneOrAccount: dto.recipientPhoneOrAccount,
      customerName: dto.customerName || 'Walk-in Customer',
      amountBdt: amount,
      serviceChargeBdt: serviceCharge,
      commissionEarnedBdt: commission,
      totalProfitEarnedBdt,
      notes: dto.notes || '',
      resultingWalletBalance: balances[dto.wallet],
      resultingCashBalance: balances.PHYSICAL_CASH_DRAWER,
      recordedAt: new Date().toISOString()
    };

    const audit = await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        action: `DIGITAL_TRX_${dto.transactionType}`,
        entityType: 'DigitalUtilityTransaction',
        entityId: trxId,
        oldData: undefined,
        newData: logPayload as any
      }
    });

    return {
      success: true,
      id: audit.id,
      trxId,
      totalProfitEarnedBdt,
      updatedBalances: balances,
      message: `${dto.transactionType.replace(/_/g, ' ')} of ৳${amount.toLocaleString()} logged successfully. Earned profit: ৳${totalProfitEarnedBdt}`
    };
  }
}
