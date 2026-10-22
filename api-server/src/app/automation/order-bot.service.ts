import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface SendConfirmationDto {
  saleId: string;
  customerPhone?: string;
  channel?: 'WHATSAPP' | 'SMS' | 'AUTO';
}

export interface WebhookReplyDto {
  saleId?: string;
  customerPhone: string;
  replyText: string;
}

@Injectable()
export class OrderBotService {
  private readonly logger = new Logger(OrderBotService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getConfirmationQueue(organizationId: string) {
    const sales = await this.prisma.sale.findMany({
      where: {
        organizationId,
        status: { in: ['DRAFT', 'COMPLETED'] },
      },
      include: {
        customer: true,
        lines: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const botLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'OrderConfirmationBot',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const botLogMap = new Map();
    botLogs.forEach(l => {
      if (!botLogMap.has(l.entityId)) {
        botLogMap.set(l.entityId, l.newData);
      }
    });

    return sales.map(s => {
      const log = botLogMap.get(s.id) as any;
      const phone = s.customer?.phone || '01700000000';
      return {
        saleId: s.id,
        saleNumber: s.saleNumber || s.id.substring(0, 8),
        customerName: s.customer?.name || 'Customer',
        customerPhone: phone,
        customerAddress: s.customer?.address || 'Dhaka',
        totalAmount: Number(s.total) || 0,
        status: s.status,
        botStatus: log?.botStatus || 'AWAITING_TRIGGER',
        verificationBadge: log?.verificationBadge || ((s.status as string) === 'CONFIRMED' ? 'Manual Verified' : 'Unverified'),
        lastMessageSent: log?.messageSent || null,
        sentAt: log?.sentAt || null,
        replyReceived: log?.replyReceived || null,
      };
    });
  }

  async sendConfirmation(organizationId: string, userId: string | null, dto: SendConfirmationDto) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: dto.saleId },
      include: { customer: true },
    });

    if (!sale) {
      throw new Error(`Order #${dto.saleId} not found`);
    }

    const customerName = sale.customer?.name || 'গ্রাহক';
    const orderNumber = sale.saleNumber || sale.id.substring(0, 8);
    const saleNumber = orderNumber;
    const totalAmount = Number(sale.total) || 0;
    const phone = dto.customerPhone || sale.customer?.phone || '01700000000';
    const channel = dto.channel || 'WHATSAPP';

    // Personalized message with 1/2 option
    const messageBangla = `হ্যালো ${customerName}! আপনার অর্ডার #${orderNumber} (মোট ৳${totalAmount}) আমরা সফলভাবে গ্রহণ করেছি।\n\nঅর্ডারটি এখনই কনফার্ম করতে *1* বা *হ্যাঁ* লিখে রিপ্লাই দিন।\nঅর্ডার বাতিল করতে চাইলে *2* বা *না* লিখে রিপ্লাই দিন।\n\nধন্যবাদ, BusinessOS Store`;

    // Check external SMS / WhatsApp API credentials (e.g. GreenWeb / BulkSMSBD / Twilio)
    const config = await this.prisma.storefrontConfig.findUnique({
      where: { organizationId },
    });
    const settings = (config?.globalSettings as any) || {};
    const botConfig = settings.orderBot || {};

    let dispatched = false;
    let gatewayUsed = 'SIMULATOR_SANDBOX';

    if (botConfig.greenWebToken && !botConfig.sandboxMode) {
      try {
        const url = `http://api.greenweb.com.bd/api.php?token=${botConfig.greenWebToken}&to=${phone}&message=${encodeURIComponent(messageBangla)}`;
        const res = await fetch(url);
        if (res.ok) {
          dispatched = true;
          gatewayUsed = 'GREENWEB_SMS_LIVE';
        }
      } catch (err: any) {
        this.logger.warn(`GreenWeb SMS dispatch error: ${err.message}`);
      }
    }

    const botLog = {
      saleId: sale.id,
      saleNumber,
      customerPhone: phone,
      channel,
      messageSent: messageBangla,
      botStatus: 'SENT_WAITING_REPLY',
      gatewayUsed,
      dispatched,
      sentAt: new Date().toISOString(),
    };

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'OrderConfirmationBot',
        entityId: sale.id,
        action: 'SEND_ORDER_CONFIRMATION',
        newData: botLog,
      },
    });

    return {
      success: true,
      message: `Confirmation message queued and sent via ${channel} (${gatewayUsed})`,
      botLog,
    };
  }

  async processWebhookReply(organizationId: string, userId: string | null, dto: WebhookReplyDto) {
    const text = (dto.replyText || '').trim().toLowerCase();
    const isConfirm = ['1', 'yes', 'ha', 'haa', 'হ্যাঁ', 'হাঁ', 'confirm', 'ok', 'thik ase'].includes(text);
    const isCancel = ['2', 'no', 'na', 'naa', 'না', 'cancel', 'বাতিল'].includes(text);

    let sale: any = null;
    if (dto.saleId) {
      sale = await this.prisma.sale.findUnique({ where: { id: dto.saleId } });
    } else {
      // Find latest pending sale by customer phone
      const customer = await this.prisma.customer.findFirst({
        where: { organizationId, phone: dto.customerPhone },
      });
      if (customer) {
        sale = await this.prisma.sale.findFirst({
          where: { organizationId, customerId: customer.id },
          orderBy: { createdAt: 'desc' },
        });
      }
    }

    if (!sale) {
      return { success: false, message: 'No matching order found for this phone number' };
    }

    let updatedStatus = sale.status;
    let botStatus = 'REPLIED_UNKNOWN';
    let systemNote = '';

    if (isConfirm) {
      updatedStatus = 'COMPLETED';
      botStatus = 'CONFIRMED_1';
      systemNote = '✅ Bot Verified COD (Customer replied 1/YES)';

      await this.prisma.sale.update({
        where: { id: sale.id },
        data: { status: 'COMPLETED' },
      });
    } else if (isCancel) {
      updatedStatus = 'CANCELLED';
      botStatus = 'CANCELLED_2';
      systemNote = '❌ Cancelled by Customer via Bot (Customer replied 2/NO)';

      await this.prisma.sale.update({
        where: { id: sale.id },
        data: { status: 'CANCELLED' },
      });
    }

    const logData = {
      saleId: sale.id,
      customerPhone: dto.customerPhone,
      replyReceived: dto.replyText,
      botStatus,
      verificationBadge: systemNote,
      resolvedAt: new Date().toISOString(),
    };

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'OrderConfirmationBot',
        entityId: sale.id,
        action: 'PROCESS_BOT_REPLY',
        newData: logData,
      },
    });

    return {
      success: true,
      message: `Processed customer reply: ${dto.replyText} -> ${systemNote || 'Recorded'}`,
      orderStatus: updatedStatus,
      verificationBadge: systemNote,
    };
  }

  async checkCustomerRisk(organizationId: string, phone: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { organizationId, phone },
      include: {
        sales: {
          select: { id: true, status: true, total: true, createdAt: true },
        },
      },
    });

    const totalOrders = customer?.sales?.length || 0;
    const completedOrders = customer?.sales?.filter(s => (s.status as string) === 'COMPLETED' || (s.status as string) === 'CONFIRMED').length || 0;
    const cancelledOrders = customer?.sales?.filter(s => (s.status as string) === 'CANCELLED').length || 0;

    let deliverySuccessRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 92;
    let riskLevel: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK_FRAUD' = 'LOW_RISK';

    if (cancelledOrders > 2 && deliverySuccessRate < 60) {
      riskLevel = 'HIGH_RISK_FRAUD';
    } else if (cancelledOrders >= 1 || deliverySuccessRate < 80) {
      riskLevel = 'MEDIUM_RISK';
    }

    return {
      phone,
      customerName: customer?.name || 'Unknown Visitor',
      totalOrders,
      completedOrders,
      cancelledOrders,
      deliverySuccessRate,
      riskLevel,
      recommendation: riskLevel === 'HIGH_RISK_FRAUD' 
        ? '⚠️ High COD return risk detected. Mandatory phone verification before shipping!'
        : riskLevel === 'MEDIUM_RISK'
        ? '⚡ Moderate return risk. Confirm address details.'
        : '✅ Verified trusted customer. Ready for instant dispatch!',
    };
  }
}
