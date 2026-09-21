import { Injectable, Logger } from '@nestjs/common';
import { FinanceIntegrationRepository } from './finance-integration.repository';
import { FinanceService, CreateJournalEntryDto, CreateJournalLineDto } from '../finance/finance.service';
import { PrismaClientManager, IUnitOfWork } from '../common/prisma/prisma-client.manager';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma, PaymentMethod, ProductType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class FinanceIntegrationService {
  private readonly logger = new Logger(FinanceIntegrationService.name);

  constructor(
    private readonly repo: FinanceIntegrationRepository,
    private readonly financeService: FinanceService,
    private readonly prismaManager: PrismaClientManager,
    private readonly uow: IUnitOfWork,
  ) {}

  async processPendingOutboxEvents(organizationId?: string) {
    let processedCount = 0;
    while (true) {
      const event = await this.repo.claimNextPendingEvent(organizationId);
      if (!event) {
        break; // No more pending events
      }

      try {
        await this.processEvent(event);
        processedCount++;
      } catch (error: any) {
        this.logger.error(`Failed to process event ${event.id}: ${error.message}`, error.stack);
        const isRetryable = error.message.includes('Prisma') || error.message.includes('Connection');
        await this.repo.markEventFailed(event.id, error.message, isRetryable);
      }
    }
    return processedCount;
  }

  private async processEvent(event: any) {
    if (event.eventType === 'SALE_COMPLETED' && event.aggregateType === 'Sale') {
      await this.processSaleCompletedEvent(event);
    } else if (event.eventType === 'PURCHASE_COMPLETED' && event.aggregateType === 'Purchase') {
      await this.processPurchaseCompletedEvent(event);
    } else if (event.eventType === 'PURCHASE_PAYMENT' && event.aggregateType === 'Purchase') {
      await this.processPurchasePaymentEvent(event);
    } else if (event.eventType === 'SALE_PAYMENT' && event.aggregateType === 'SalePayment') {
      await this.processSalePaymentEvent(event);
    } else {
      throw new Error(`Unsupported event type: ${event.eventType}`);
    }
  }

  private async processPurchaseCompletedEvent(event: any) {
    const payload = event.payload as any;
    const purchaseId = payload.purchaseId;

    const purchase = await this.prismaManager.client.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        lines: true,
        payments: true,
      },
    });

    if (!purchase) throw new Error(`Purchase not found: ${purchaseId}`);

    const config = await this.repo.getConfig(event.organizationId);
    if (!config || !config.inventoryAssetAccountId || !config.accountsPayableAccountId) {
      throw new Error('Finance integration config missing required accounts (Inventory / AP).');
    }

    const lines: CreateJournalLineDto[] = [];
    const purchaseTotal = new Decimal(purchase.total);
    let totalPaid = new Decimal(0);

    for (const payment of purchase.payments) {
      const amount = new Decimal(payment.amount);
      totalPaid = totalPaid.plus(amount);

      let accountId: string | null = null;
      if (payment.method === 'CASH') accountId = config.cashAccountId;
      else if (payment.method === 'BANK') accountId = config.bankAccountId;
      else if (payment.method === 'MOBILE_BANKING') accountId = config.mobileBankingAccountId;
      else accountId = config.cashAccountId;

      if (!accountId) throw new Error(`Payment account for method ${payment.method} not configured.`);
      lines.push({ accountId, credit: amount, branchId: purchase.branchId || undefined });
    }

    if (totalPaid.lessThan(purchaseTotal)) {
      const apAmount = purchaseTotal.minus(totalPaid);
      lines.push({ accountId: config.accountsPayableAccountId, credit: apAmount, branchId: purchase.branchId || undefined });
    }

    if (purchaseTotal.greaterThan(0)) {
      lines.push({ accountId: config.inventoryAssetAccountId, debit: purchaseTotal, branchId: purchase.branchId || undefined });
    }

    await this.uow.run(async () => {
      const dto: CreateJournalEntryDto = {
        accountingDate: purchase.purchaseDate,
        referenceType: 'PURCHASE',
        referenceId: purchase.id,
        idempotencyKey: event.id,
        description: `Purchase ${purchase.id}`,
        lines: lines,
      };

      const draftEntry = await this.financeService.createDraftJournalEntry(event.organizationId, 'SYSTEM', dto);
      await this.financeService.postJournalEntry(event.organizationId, draftEntry.id, 'SYSTEM');
      await this.repo.markEventCompleted(event.id);
    });
  }

  private async processPurchasePaymentEvent(event: any) {
    const payload = event.payload as any;
    const purchasePaymentId = payload.purchasePaymentId;

    const payment = await this.prismaManager.client.purchasePayment.findUnique({
      where: { id: purchasePaymentId },
      include: { purchase: true },
    });

    if (!payment) throw new Error(`PurchasePayment not found: ${purchasePaymentId}`);

    const config = await this.repo.getConfig(event.organizationId);
    if (!config || !config.accountsPayableAccountId) {
      throw new Error('Finance config missing Accounts Payable.');
    }

    let accountId: string | null = null;
    if (payment.method === 'CASH') accountId = config.cashAccountId;
    else if (payment.method === 'BANK') accountId = config.bankAccountId;
    else if (payment.method === 'MOBILE_BANKING') accountId = config.mobileBankingAccountId;
    else accountId = config.cashAccountId;

    if (!accountId) throw new Error(`Payment account for method ${payment.method} not configured.`);

    const lines: CreateJournalLineDto[] = [
      { accountId: config.accountsPayableAccountId, debit: new Decimal(payment.amount), branchId: payment.purchase.branchId || undefined },
      { accountId, credit: new Decimal(payment.amount), branchId: payment.purchase.branchId || undefined },
    ];

    await this.uow.run(async () => {
      const dto: CreateJournalEntryDto = {
        accountingDate: payment.paymentDate,
        referenceType: 'PURCHASE_PAYMENT',
        referenceId: payment.id,
        idempotencyKey: event.id,
        description: `Payment for Purchase ${payment.purchaseId}`,
        lines: lines,
      };

      const draftEntry = await this.financeService.createDraftJournalEntry(event.organizationId, 'SYSTEM', dto);
      await this.financeService.postJournalEntry(event.organizationId, draftEntry.id, 'SYSTEM');
      await this.repo.markEventCompleted(event.id);
    });
  }

  private async processSalePaymentEvent(event: any) {
    const payload = event.payload as any;
    const salePaymentId = payload.salePaymentId;

    const payment = await this.prismaManager.client.salePayment.findUnique({
      where: { id: salePaymentId },
      include: { sale: true },
    });

    if (!payment) throw new Error(`SalePayment not found: ${salePaymentId}`);

    const config = await this.repo.getConfig(event.organizationId);
    if (!config || !config.accountsReceivableAccountId) {
      throw new Error('Finance config missing Accounts Receivable.');
    }

    let accountId: string | null = null;
    if (payment.method === 'CASH') accountId = config.cashAccountId;
    else if (payment.method === 'BANK') accountId = config.bankAccountId;
    else if (payment.method === 'MOBILE_BANKING') accountId = config.mobileBankingAccountId;
    else accountId = config.cashAccountId;

    if (!accountId) throw new Error(`Payment account for method ${payment.method} not configured.`);

    const lines: CreateJournalLineDto[] = [
      { accountId, debit: new Decimal(payment.amount), branchId: payment.sale.branchId || undefined },
      { accountId: config.accountsReceivableAccountId, credit: new Decimal(payment.amount), branchId: payment.sale.branchId || undefined },
    ];

    await this.uow.run(async () => {
      const dto: CreateJournalEntryDto = {
        accountingDate: payment.paymentDate,
        referenceType: 'SALE_PAYMENT',
        referenceId: payment.id,
        idempotencyKey: event.id,
        description: `Payment for Sale ${payment.saleId}`,
        lines: lines,
      };

      const draftEntry = await this.financeService.createDraftJournalEntry(event.organizationId, 'SYSTEM', dto);
      await this.financeService.postJournalEntry(event.organizationId, draftEntry.id, 'SYSTEM');
      await this.repo.markEventCompleted(event.id);
    });
  }

  private async processSaleCompletedEvent(event: any) {
    const payload = event.payload as any;
    const saleId = payload.saleId;

    const sale = await this.prismaManager.client.sale.findUnique({
      where: { id: saleId },
      include: {
        lines: { include: { variant: { include: { product: true } } } },
        payments: true,
      },
    });

    if (!sale) {
      throw new Error(`Sale not found: ${saleId}`);
    }

    const config = await this.repo.getConfig(event.organizationId);
    if (!config) {
      throw new Error('FinanceIntegrationConfig is missing for this organization.');
    }

    const lines: CreateJournalLineDto[] = [];
    const saleTotal = new Decimal(sale.total);
    let totalPaid = new Decimal(0);

    for (const payment of sale.payments) {
      const amount = new Decimal(payment.amount);
      totalPaid = totalPaid.plus(amount);

      let accountId: string | null = null;
      if (payment.method === PaymentMethod.CASH) accountId = config.cashAccountId;
      else if (payment.method === PaymentMethod.BANK) accountId = config.bankAccountId;
      else if (payment.method === PaymentMethod.MOBILE_BANKING) accountId = config.mobileBankingAccountId;
      else accountId = config.cashAccountId;

      if (!accountId) {
        throw new Error(`Payment account for method ${payment.method} is not configured.`);
      }

      lines.push({ accountId, debit: amount, branchId: sale.branchId });
    }

    if (totalPaid.lessThan(saleTotal)) {
      const arAmount = saleTotal.minus(totalPaid);
      if (!config.accountsReceivableAccountId) {
        throw new Error('Accounts Receivable account is not configured for this organization, but sale has partial payment.');
      }
      lines.push({ accountId: config.accountsReceivableAccountId, debit: arAmount, branchId: sale.branchId });
    }

    let productSubtotal = new Decimal(0);
    let serviceSubtotal = new Decimal(0);

    for (const line of sale.lines) {
      if (line.variant?.product?.type === ProductType.PRODUCT) {
        productSubtotal = productSubtotal.plus(line.lineTotal);
      } else if (line.variant?.product?.type === ProductType.SERVICE) {
        serviceSubtotal = serviceSubtotal.plus(line.lineTotal);
      }
    }

    const totalLines = productSubtotal.plus(serviceSubtotal);
    let productRevenue = productSubtotal;
    let serviceRevenue = serviceSubtotal;

    const saleDiscount = new Decimal(sale.discount || 0);
    if (saleDiscount.greaterThan(0) && totalLines.greaterThan(0)) {
      const productRatio = productSubtotal.dividedBy(totalLines);
      const productDiscountShare = saleDiscount.times(productRatio).toDecimalPlaces(4);
      const serviceDiscountShare = saleDiscount.minus(productDiscountShare);

      productRevenue = productSubtotal.minus(productDiscountShare);
      serviceRevenue = serviceSubtotal.minus(serviceDiscountShare);
    }

    if (productRevenue.greaterThan(0)) {
      if (!config.salesRevenueAccountId) throw new Error('Sales Revenue account is not configured.');
      lines.push({ accountId: config.salesRevenueAccountId, credit: productRevenue, branchId: sale.branchId });
    }
    if (serviceRevenue.greaterThan(0)) {
      if (!config.serviceRevenueAccountId) throw new Error('Service Revenue account is not configured.');
      lines.push({ accountId: config.serviceRevenueAccountId, credit: serviceRevenue, branchId: sale.branchId });
    }

    await this.uow.run(async () => {
      const dto: CreateJournalEntryDto = {
        accountingDate: sale.saleDate,
        referenceType: 'SALE',
        referenceId: sale.id,
        idempotencyKey: event.id,
        description: `Sale ${sale.saleNumber || sale.id}`,
        fiscalPeriodId: sale.fiscalPeriodId,
        lines: lines,
      };

      const draftEntry = await this.financeService.createDraftJournalEntry(event.organizationId, sale.createdByUserId || 'SYSTEM', dto);
      await this.financeService.postJournalEntry(event.organizationId, draftEntry.id, sale.createdByUserId || 'SYSTEM');
      await this.repo.markEventCompleted(event.id);
    });
  }
}
