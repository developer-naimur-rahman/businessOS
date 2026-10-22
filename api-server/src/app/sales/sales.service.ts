import { Injectable, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { SalesRepository } from './sales.repository';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../business-core/services/products.service';
import { VariantsService } from '../business-core/services/variants.service';
import { WarehousesService } from '../operational-structure/warehouses/warehouses.service';
import { CustomersService } from '../business-core/services/customers.service';
import { BranchesService } from '../operational-structure/branches/branches.service';
import { Prisma, PaymentMethod } from '@prisma/client';
import { PrismaClientManager } from '../common/prisma/prisma-client.manager';
import { QuerySalesDto, UpdateOrderStatusDto, CreateCustomerCheckoutDto } from './dto/sales.dto';
import { NotificationService } from '../common/notifications/notification.service';

export interface CreateSaleDto {
  branchId: string;
  warehouseId: string;
  customerId?: string;
  idempotencyKey?: string;
  lines: Array<{
    variantId: string;
    quantity: string | number;
    discount?: string | number;
  }>;
  payments?: Array<{
    method: PaymentMethod;
    amount: string | number;
    reference?: string;
  }>;
}

export interface AddSalePaymentDto {
  amount: number | string;
  method: PaymentMethod;
  reference?: string;
  paymentDate: string | Date;
  idempotencyKey?: string;
}

@Injectable()
export class SalesService {
  constructor(
    private readonly salesRepo: SalesRepository,
    private readonly inventoryService: InventoryService,
    private readonly productsService: ProductsService,
    private readonly variantsService: VariantsService,
    private readonly warehousesService: WarehousesService,
    private readonly customersService: CustomersService,
    private readonly branchesService: BranchesService,
    private readonly prismaManager: PrismaClientManager,
    @Optional() private readonly notificationService?: NotificationService,
  ) {}

  async createDirectSale(organizationId: string, data: CreateSaleDto, userId: string, internalOverrides?: { [variantId: string]: number }) {
    if (data.idempotencyKey) {
      const existing = await this.salesRepo.findByIdempotencyKey(organizationId, data.idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    // 1. Validations
    if (!data.lines || data.lines.length === 0) {
      throw new BadRequestException('Sale must have at least one line.');
    }

    const branch = await this.branchesService.findOne(organizationId, data.branchId);
    if (!branch.isActive) throw new BadRequestException('Branch is inactive.');

    const warehouse = await this.warehousesService.findOne(organizationId, data.warehouseId);
    if (!warehouse.isActive) throw new BadRequestException('Warehouse is inactive.');
    if (warehouse.branchId !== branch.id) {
      throw new BadRequestException('Warehouse does not belong to the specified branch.');
    }

    if (data.customerId) {
      const customer = await this.customersService.findOne(organizationId, data.customerId);
      if (customer.status !== 'ACTIVE') throw new BadRequestException('Customer is inactive.');
    }

    let subtotal = new Prisma.Decimal(0);
    const saleLinesToCreate = [];
    const inventoryItemsToDeduct = [];

    for (const line of data.lines) {
      if ((line as any).productId) {
        throw new BadRequestException('Legacy productId is no longer supported. Use variantId.');
      }
      if (!line.variantId) {
        throw new BadRequestException('variantId is required for all sale lines.');
      }

      const quantity = new Prisma.Decimal(line.quantity);
      if (quantity.lte(0)) throw new BadRequestException('Quantity must be greater than zero.');

      const variant = await this.variantsService.findOne(organizationId, line.variantId);
      const product = await this.productsService.findOne(organizationId, variant.productId);
      if (!product.isActive) throw new BadRequestException(`Product ${product.name} is inactive.`);
      // Assuming variant has sellingPrice, but let's just use product's if variant doesn't have it (or variant overrides it)
      let unitPrice = (variant as any).posPrice ?? (variant as any).retailPrice ?? product.sellingPrice;
      if (internalOverrides && internalOverrides[line.variantId] !== undefined) {
        unitPrice = new Prisma.Decimal(internalOverrides[line.variantId]);
      }
      const lineSubtotal = unitPrice.mul(quantity);
      const discount = line.discount ? new Prisma.Decimal(line.discount) : new Prisma.Decimal(0);
      
      if (discount.lt(0)) throw new BadRequestException('Discount cannot be negative.');
      if (discount.gt(lineSubtotal)) throw new BadRequestException('Discount cannot exceed line subtotal.');

      const lineTotal = lineSubtotal.sub(discount);
      subtotal = subtotal.add(lineTotal); // Note: this is adding to the overall subtotal of the sale (which conceptually is the sum of line totals)

      saleLinesToCreate.push({
        variantId: variant.id,
        quantity,
        unitPrice,
        discount,
        lineSubtotal,
        lineTotal,
        productNameSnapshot: product.name,
        skuSnapshot: variant.sku,
      });

      if (product.type === 'PRODUCT' && !product.isDropship) {
        inventoryItemsToDeduct.push({
          variantId: variant.id,
          quantity,
        });
      }
    }

    const totalDiscount = new Prisma.Decimal(0); // We only support line discounts for now to keep it simple, or can implement sale-level discount later
    const grandTotal = subtotal.sub(totalDiscount);

    // Payments
    let totalPaid = new Prisma.Decimal(0);
    const paymentsToCreate = [];
    if (data.payments) {
      for (const p of data.payments) {
        const amount = new Prisma.Decimal(p.amount);
        if (amount.lte(0)) throw new BadRequestException('Payment amount must be greater than zero.');
        totalPaid = totalPaid.add(amount);

        let method = p.method as any;
        if (method === 'CARD' || method === 'CREDIT_CARD' || method === 'DEBIT_CARD') {
          method = PaymentMethod.BANK;
        } else if (!Object.values(PaymentMethod).includes(method)) {
          method = PaymentMethod.OTHER;
        }

        paymentsToCreate.push({
          organizationId,
          method,
          amount,
          reference: p.reference,
        });
      }
    }

    if (totalPaid.gt(grandTotal)) {
      throw new BadRequestException('Overpayment is not supported.');
    }

    let paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' = 'UNPAID';
    if (totalPaid.equals(grandTotal) && grandTotal.gt(0)) {
      paymentStatus = 'PAID';
    } else if (totalPaid.gt(0)) {
      paymentStatus = 'PARTIALLY_PAID';
    } else if (grandTotal.equals(0)) {
      paymentStatus = 'PAID'; // Free sale
    }

    // 2. Transaction Execution
    return this.salesRepo.runTransaction(async () => {
      // It's crucial to check idempotency AGAIN inside the transaction under read-committed to avoid race conditions!
      if (data.idempotencyKey) {
        const existingTxCheck = await this.salesRepo.findByIdempotencyKey(organizationId, data.idempotencyKey);
        if (existingTxCheck) return existingTxCheck;
      }

      const saleNumber = await this.salesRepo.generateSaleNumber(organizationId);

      const sale = await this.salesRepo.createSale({
        organizationId,
        branchId: data.branchId,
        warehouseId: data.warehouseId,
        customerId: data.customerId,
        status: 'COMPLETED',
        paymentStatus,
        saleNumber,
        subtotal,
        discount: totalDiscount,
        total: grandTotal,
        idempotencyKey: data.idempotencyKey,
        createdByUserId: userId,
        lines: {
          create: saleLinesToCreate,
        },
        payments: {
          create: paymentsToCreate,
        },
      });

      if (inventoryItemsToDeduct.length > 0) {
        await this.inventoryService.deductStockForSale(
          organizationId,
          data.warehouseId,
          inventoryItemsToDeduct,
          sale.id,
          userId,
        );
      }

      await this.prismaManager.client.outboxEvent.create({
        data: {
          organizationId,
          eventType: 'SALE_COMPLETED',
          aggregateType: 'Sale',
          aggregateId: sale.id,
          payload: {
            saleId: sale.id,
            saleNumber: sale.saleNumber,
            completedAt: new Date(),
          },
        },
      });

      return sale;
    });
  }

  async getSales(organizationId: string) {
    // For Phase 5 we can just expose a basic list (in reality this would have pagination, etc)
    return this.salesRepo['client'].sale.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { lines: true, payments: true }
    });
  }

  async getSaleById(organizationId: string, id: string) {
    const sale = await this.salesRepo.findById(organizationId, id);
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  async addPayment(organizationId: string, id: string, dto: AddSalePaymentDto) {
    return this.salesRepo.runTransaction(async () => {
      const sale = await this.salesRepo.findById(organizationId, id);
      if (!sale) throw new NotFoundException('Sale not found');
      if (sale.status !== 'COMPLETED') {
        throw new BadRequestException('Payments can only be added to COMPLETED sales.');
      }

      const currentPaid = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const newTotalPaid = currentPaid + Number(dto.amount);
      if (newTotalPaid > Number(sale.total) + 0.01) { // 0.01 for rounding
        throw new BadRequestException('Payment exceeds outstanding balance.');
      }

      // Check idempotency inside transaction
      if (dto.idempotencyKey) {
        const existingPayment = await this.salesRepo.findPaymentByIdempotencyKey(organizationId, dto.idempotencyKey);
        if (existingPayment) return existingPayment;
      }

      const payment = await this.salesRepo.addPayment(organizationId, {
        organization: { connect: { id: organizationId } },
        sale: { connect: { id } },
        amount: dto.amount,
        method: dto.method,
        reference: dto.reference,
        paymentDate: new Date(dto.paymentDate),
        idempotencyKey: dto.idempotencyKey,
      });

      // Recalculate payment status
      let paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' = 'UNPAID';
      const grandTotal = new Prisma.Decimal(sale.total);
      const totalPaid = new Prisma.Decimal(newTotalPaid);

      if (totalPaid.equals(grandTotal) && grandTotal.gt(0)) {
        paymentStatus = 'PAID';
      } else if (totalPaid.gt(0)) {
        paymentStatus = 'PARTIALLY_PAID';
      } else if (grandTotal.equals(0)) {
        paymentStatus = 'PAID'; // Free sale
      }

      if (sale.paymentStatus !== paymentStatus) {
        await this.salesRepo.updatePaymentStatus(organizationId, id, paymentStatus);
      }

      await this.prismaManager.client.outboxEvent.create({
        data: {
          organizationId,
          eventType: 'SALE_PAYMENT',
          aggregateType: 'SalePayment',
          aggregateId: payment.id,
          payload: { salePaymentId: payment.id },
        }
      });

      return payment;
    });
  }

  async getOrders(organizationId: string, query: QuerySalesDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {
      organizationId,
    };

    if (query.status) {
      where.status = query.status as any;
    }

    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus as any;
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { saleNumber: { contains: s, mode: 'insensitive' } },
        { customer: { name: { contains: s, mode: 'insensitive' } } },
        { customer: { phone: { contains: s, mode: 'insensitive' } } },
        { customer: { email: { contains: s, mode: 'insensitive' } } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const { items, total } = await this.salesRepo.findManyWithPagination(organizationId, {
      skip,
      take: limit,
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getOrderDetailsWithAudit(organizationId: string, id: string) {
    const sale = await this.salesRepo.findById(organizationId, id);
    if (!sale) throw new NotFoundException('Order not found');

    const auditLogs = await this.salesRepo.getAuditLogsForEntity(organizationId, 'Sale', id);

    return {
      ...sale,
      auditLogs,
    };
  }

  async updateOrderStatus(organizationId: string, id: string, dto: UpdateOrderStatusDto, userId?: string) {
    return this.salesRepo.runTransaction(async () => {
      const sale = await this.salesRepo.findById(organizationId, id);
      if (!sale) throw new NotFoundException('Order not found');

      if (sale.status === 'CANCELLED') {
        throw new BadRequestException('Order has already been cancelled and cannot be modified.');
      }

      // Check transition validity
      if (dto.status === 'CANCELLED') {
        // Safe inventory restoration: restore only physical items
        const physicalItems = sale.lines
          .filter((l: any) => l.variant?.product?.type === 'PRODUCT' && !l.variant?.product?.isDropship)
          .map((l: any) => ({
            variantId: l.variantId,
            quantity: l.quantity,
          }));

        if (physicalItems.length > 0) {
          await this.inventoryService.restoreStockForCancelledSale(
            organizationId,
            sale.warehouseId,
            physicalItems,
            sale.id,
            userId,
          );
        }

        const updated = await this.salesRepo.updateSaleStatusAndFulfillment(
          organizationId,
          id,
          'CANCELLED',
          'CANCELLED',
        );

        await this.salesRepo.recordAuditLog({
          organizationId,
          entityType: 'Sale',
          entityId: sale.id,
          action: 'ORDER_CANCELLED',
          oldData: { status: sale.status },
          newData: {
            status: 'CANCELLED',
            note: dto.note || 'Order cancelled by administrator',
            courier: dto.courier,
            trackingCode: dto.trackingCode,
          },
          userId: userId || null,
        });

        await this.prismaManager.client.outboxEvent.create({
          data: {
            organizationId,
            eventType: 'ORDER_STATUS_CHANGED',
            aggregateType: 'Sale',
            aggregateId: sale.id,
            payload: { saleId: sale.id, status: 'CANCELLED', previousStatus: sale.status },
          },
        });

        return updated;
      }

      if (dto.status === 'COMPLETED') {
        const updated = await this.salesRepo.updateSaleStatusAndFulfillment(
          organizationId,
          id,
          'COMPLETED',
          dto.fulfillmentStatus || 'COMPLETED',
        );

        await this.salesRepo.recordAuditLog({
          organizationId,
          entityType: 'Sale',
          entityId: sale.id,
          action: 'ORDER_COMPLETED',
          oldData: { status: sale.status },
          newData: {
            status: 'COMPLETED',
            fulfillmentStatus: dto.fulfillmentStatus || 'COMPLETED',
            note: dto.note,
            courier: dto.courier,
            trackingCode: dto.trackingCode,
          },
          userId: userId || null,
        });

        await this.prismaManager.client.outboxEvent.create({
          data: {
            organizationId,
            eventType: 'ORDER_STATUS_CHANGED',
            aggregateType: 'Sale',
            aggregateId: sale.id,
            payload: { saleId: sale.id, status: 'COMPLETED', previousStatus: sale.status },
          },
        });

        return updated;
      }

      // If status is DRAFT (processing / shipping fulfillment updates)
      const updated = await this.salesRepo.updateSaleStatusAndFulfillment(
        organizationId,
        id,
        'DRAFT',
        dto.fulfillmentStatus,
      );

      await this.salesRepo.recordAuditLog({
        organizationId,
        entityType: 'Sale',
        entityId: sale.id,
        action: 'ORDER_STATUS_UPDATED',
        oldData: { status: sale.status },
        newData: {
          status: 'DRAFT',
          fulfillmentStatus: dto.fulfillmentStatus,
          note: dto.note,
          courier: dto.courier,
          trackingCode: dto.trackingCode,
        },
        userId: userId || null,
      });

      await this.prismaManager.client.outboxEvent.create({
        data: {
          organizationId,
          eventType: 'ORDER_STATUS_CHANGED',
          aggregateType: 'Sale',
          aggregateId: sale.id,
          payload: {
            saleId: sale.id,
            status: 'DRAFT',
            fulfillmentStatus: dto.fulfillmentStatus,
          },
        },
      });

      this.notificationService?.notifyOrderStatusChange({
        organizationId,
        orderId: sale.id,
        saleNumber: sale.saleNumber || sale.id,
        customerName: sale.customer?.name,
        customerPhone: sale.customer?.phone,
        customerEmail: sale.customer?.email,
        status: dto.status,
        fulfillmentStatus: dto.fulfillmentStatus,
        courier: dto.courier,
        trackingCode: dto.trackingCode,
        note: dto.note,
      }).catch(() => {});

      return updated;
    });
  }

  async createOnlineOrder(organizationId: string, customerId: string, data: CreateCustomerCheckoutDto) {
    if (data.idempotencyKey) {
      const existing = await this.salesRepo.findByIdempotencyKey(organizationId, data.idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    const rawLines = data.items || data.lines || [];
    if (rawLines.length === 0) {
      throw new BadRequestException('Order must have at least one line item.');
    }

    // Default storefront branch & warehouse
    const branch = await this.branchesService.findAll(organizationId).then(b => b[0]);
    if (!branch) {
      throw new BadRequestException('No active branch found for online sales.');
    }
    const warehouse = await this.warehousesService.findAll(organizationId).then(w => w.find(item => item.branchId === branch.id) || w[0]);
    if (!warehouse) {
      throw new BadRequestException('No active warehouse found for online sales.');
    }

    // Resolve variant IDs
    const resolvedLines: Array<{ variantId: string; quantity: number; discount: number; unitPrice?: number }> = [];

    for (const item of rawLines) {
      let variantId = item.variantId;
      if (!variantId && item.productId) {
        // Find or create default variant
        const existingVariant = await this.prismaManager.client.productVariant.findFirst({
          where: { organizationId, productId: item.productId },
        });

        if (existingVariant) {
          variantId = existingVariant.id;
        } else {
          const product = await this.productsService.findOne(organizationId, item.productId);
          const genSku = `${product.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'VAR'}-${Date.now().toString().slice(-4)}`;
          const createdVariant = await this.prismaManager.client.productVariant.create({
            data: {
              organizationId,
              productId: item.productId,
              sku: genSku,
              name: 'Standard',
              sellingPrice: product.sellingPrice,
              costPrice: product.costPrice || 0,
            },
          });
          variantId = createdVariant.id;
        }
      }

      if (!variantId) {
        throw new BadRequestException('Each item must specify either a productId or variantId.');
      }

      resolvedLines.push({
        variantId,
        quantity: Number(item.quantity) || 1,
        discount: Number(item.discount) || 0,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : undefined,
      });
    }

    let subtotal = new Prisma.Decimal(0);
    const saleLinesToCreate = [];
    const inventoryItemsToDeduct = [];

    for (const line of resolvedLines) {
      const quantity = new Prisma.Decimal(line.quantity);
      if (quantity.lte(0)) throw new BadRequestException('Quantity must be greater than zero.');

      const variant = await this.variantsService.findOne(organizationId, line.variantId);
      const product = await this.productsService.findOne(organizationId, variant.productId);
      if (!product.isActive) throw new BadRequestException(`Product ${product.name} is inactive.`);

      const unitPrice = line.unitPrice !== undefined ? new Prisma.Decimal(line.unitPrice) : ((variant as any).posPrice ?? (variant as any).retailPrice ?? product.sellingPrice);
      const lineSubtotal = unitPrice.mul(quantity);
      const discount = line.discount ? new Prisma.Decimal(line.discount) : new Prisma.Decimal(0);
      const lineTotal = lineSubtotal.sub(discount);
      subtotal = subtotal.add(lineTotal);

      saleLinesToCreate.push({
        variantId: variant.id,
        quantity,
        unitPrice,
        discount,
        lineSubtotal,
        lineTotal,
        productNameSnapshot: product.name,
        skuSnapshot: variant.sku,
        fulfillmentStatus: 'QUEUED' as const,
      });

      if (product.type === 'PRODUCT' && !product.isDropship) {
        inventoryItemsToDeduct.push({
          variantId: variant.id,
          quantity,
        });
      }
    }

    const couponDiscount = data.discountAmount ? new Prisma.Decimal(data.discountAmount) : new Prisma.Decimal(0);
    const grandTotal = subtotal.sub(couponDiscount).gte(0) ? subtotal.sub(couponDiscount) : new Prisma.Decimal(0);
    let paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' = 'UNPAID';
    const paymentsToCreate = [];

    if (data.paymentMethod === 'MOBILE_BANKING' || data.paymentProvider === 'bKash' || data.paymentProvider === 'Nagad' || data.transactionId) {
      const provider = data.paymentProvider || 'bKash';
      const reference = `[${provider}] TrxID: ${data.transactionId || 'PENDING'} | Sender: ${data.senderPhone || data.customerPhone || 'N/A'}`;
      paymentsToCreate.push({
        organizationId,
        method: 'MOBILE_BANKING' as const,
        amount: grandTotal,
        reference,
      });
      paymentStatus = 'UNPAID'; // Requires manual admin verification of TrxID
    } else if (data.paymentMethod === 'BANK') {
      const reference = `[BANK] TrxID: ${data.transactionId || 'PENDING'} | Sender: ${data.senderPhone || data.customerPhone || 'N/A'}`;
      paymentsToCreate.push({
        organizationId,
        method: 'BANK' as const,
        amount: grandTotal,
        reference,
      });
      paymentStatus = 'UNPAID';
    } else if (data.paymentAmount && Number(data.paymentAmount) > 0 && data.paymentMethod && data.paymentMethod !== 'CASH') {
      const amount = new Prisma.Decimal(data.paymentAmount);
      paymentsToCreate.push({
        organizationId,
        method: data.paymentMethod,
        amount,
        reference: 'Storefront Online Payment',
      });
      if (amount.greaterThanOrEqualTo(grandTotal)) {
        paymentStatus = 'PAID';
      } else {
        paymentStatus = 'PARTIALLY_PAID';
      }
    }

    return this.salesRepo.runTransaction(async () => {
      if (data.idempotencyKey) {
        const existingTxCheck = await this.salesRepo.findByIdempotencyKey(organizationId, data.idempotencyKey);
        if (existingTxCheck) return existingTxCheck;
      }

      const saleNumber = await this.salesRepo.generateSaleNumber(organizationId);

      const sale = await this.salesRepo.createSale({
        organizationId,
        branchId: branch.id,
        warehouseId: warehouse.id,
        customerId,
        status: 'DRAFT', // Online orders start as DRAFT until delivered/fulfilled
        paymentStatus,
        saleNumber,
        subtotal,
        discount: couponDiscount,
        total: grandTotal,
        idempotencyKey: data.idempotencyKey,
        lines: {
          create: saleLinesToCreate,
        },
        payments: {
          create: paymentsToCreate,
        },
      });

      // Deduct inventory so items are reserved and stock invariants are maintained
      if (inventoryItemsToDeduct.length > 0) {
        const systemUser = await this.prismaManager.client.user.findFirst({
          where: { organizationId },
        });
        if (systemUser) {
          await this.inventoryService.deductStockForSale(
            organizationId,
            warehouse.id,
            inventoryItemsToDeduct,
            sale.id,
            systemUser.id,
          );
        }
      }

      // Record audit log for order placement
      await this.salesRepo.recordAuditLog({
        organizationId,
        entityType: 'Sale',
        entityId: sale.id,
        action: 'ORDER_PLACED',
        newData: {
          status: 'DRAFT',
          fulfillmentStatus: 'QUEUED',
          paymentStatus,
          paymentMethod: data.paymentMethod || 'CASH',
          paymentProvider: data.paymentProvider || (data.paymentMethod === 'MOBILE_BANKING' ? 'bKash' : null),
          senderPhone: data.senderPhone || null,
          transactionId: data.transactionId || null,
          couponCode: data.couponCode || null,
          discountAmount: couponDiscount.toString(),
          shippingAddress: data.shippingAddress,
          customerPhone: data.customerPhone,
          notes: data.customerNotes,
          total: grandTotal.toString(),
        },
      });

      // Emit outbox event
      await this.prismaManager.client.outboxEvent.create({
        data: {
          organizationId,
          eventType: 'ORDER_PLACED',
          aggregateType: 'Sale',
          aggregateId: sale.id,
          payload: {
            saleId: sale.id,
            saleNumber: sale.saleNumber,
            total: grandTotal.toString(),
            customerId,
          },
        },
      });

      return sale;
    });
  }

  async trackOrder(organizationId: string, identifier: string, phone?: string, customerId?: string) {
    const sale = await this.prismaManager.client.sale.findFirst({
      where: {
        organizationId,
        OR: [
          { id: identifier },
          { saleNumber: identifier },
        ],
      },
      include: {
        lines: { include: { variant: { include: { product: true } } } },
        payments: true,
        customer: true,
      },
    });

    if (!sale) {
      throw new NotFoundException('Order not found.');
    }

    // Security Verification: prevent order enumeration
    const isCustomerOwner = customerId && sale.customerId === customerId;

    if (!isCustomerOwner) {
      if (!phone || !phone.trim()) {
        throw new BadRequestException('Phone number verification required to track this order.');
      }

      const cleanInputPhone = phone.replace(/[\s\-\+\(\)]/g, '').slice(-10);
      const customerPhone = (sale.customer?.phone || '').replace(/[\s\-\+\(\)]/g, '').slice(-10);

      // Also check phone recorded in audit logs during checkout
      const auditLogs = await this.salesRepo.getAuditLogsForEntity(organizationId, 'Sale', sale.id);
      const placedLog = auditLogs.find(l => l.action === 'ORDER_PLACED');
      const recordedPhone = (placedLog?.newData as any)?.customerPhone || '';
      const cleanRecordedPhone = recordedPhone.replace(/[\s\-\+\(\)]/g, '').slice(-10);

      const matchesCustomerPhone = customerPhone && customerPhone === cleanInputPhone;
      const matchesRecordedPhone = cleanRecordedPhone && cleanRecordedPhone === cleanInputPhone;

      if (!matchesCustomerPhone && !matchesRecordedPhone) {
        throw new NotFoundException('Order verification failed. Phone number does not match.');
      }
    }

    const auditLogs = await this.salesRepo.getAuditLogsForEntity(organizationId, 'Sale', sale.id);

    return {
      id: sale.id,
      saleNumber: sale.saleNumber,
      saleDate: sale.saleDate,
      status: sale.status,
      paymentStatus: sale.paymentStatus,
      subtotal: sale.subtotal,
      discount: sale.discount,
      total: sale.total,
      customer: {
        name: sale.customer?.name || 'Customer',
        phone: sale.customer?.phone ? sale.customer.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : undefined,
      },
      lines: sale.lines.map(l => ({
        id: l.id,
        productName: l.productNameSnapshot || l.variant?.product?.name || 'Product',
        sku: l.skuSnapshot || l.variant?.sku,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        lineTotal: l.lineTotal,
        fulfillmentStatus: l.fulfillmentStatus || 'QUEUED',
      })),
      payments: sale.payments.map(p => ({
        id: p.id,
        method: p.method,
        amount: p.amount,
        paymentDate: p.paymentDate,
      })),
      timeline: auditLogs.map(log => ({
        id: log.id,
        action: log.action,
        status: (log.newData as any)?.status || (log.oldData as any)?.status,
        fulfillmentStatus: (log.newData as any)?.fulfillmentStatus,
        note: (log.newData as any)?.note || (log.newData as any)?.message,
        courier: (log.newData as any)?.courier,
        trackingCode: (log.newData as any)?.trackingCode,
        createdAt: log.createdAt,
      })),
    };
  }

  async verifyPayment(organizationId: string, id: string, userId?: string) {
    return this.salesRepo.runTransaction(async () => {
      const sale = await this.salesRepo.findById(organizationId, id);
      if (!sale) throw new NotFoundException('Order not found');

      if (sale.paymentStatus === 'PAID') {
        return sale;
      }

      const updated = await this.salesRepo.updatePaymentStatus(organizationId, id, 'PAID');

      if (sale.payments && sale.payments.length > 0) {
        const firstPayment = sale.payments[0];
        await this.prismaManager.client.salePayment.update({
          where: { id: firstPayment.id },
          data: {
            amount: sale.total,
            reference: `${firstPayment.reference || ''} [VERIFIED]`.trim(),
          },
        });
      } else {
        await this.prismaManager.client.salePayment.create({
          data: {
            organizationId,
            saleId: sale.id,
            amount: sale.total,
            method: 'MOBILE_BANKING',
            reference: 'Verified by Admin',
          },
        });
      }

      await this.salesRepo.recordAuditLog({
        organizationId,
        entityType: 'Sale',
        entityId: sale.id,
        action: 'PAYMENT_VERIFIED',
        oldData: { paymentStatus: sale.paymentStatus },
        newData: { paymentStatus: 'PAID', verifiedBy: userId || 'Admin' },
        userId: userId || null,
      });

      return updated;
    });
  }

  // --- POS Hold Orders & Customer Live Display ---
  private static liveDisplayCache: Record<string, any> = {};

  async holdCart(organizationId: string, userId: string | null, data: { cart: any[]; customerName?: string; note?: string; total: number }) {
    const holdId = `HLD-${Date.now().toString().slice(-6)}`;
    const heldData = {
      holdId,
      cart: data.cart || [],
      customerName: data.customerName || 'Held Customer',
      note: data.note || 'Parked Cart',
      total: Number(data.total) || 0,
      itemCount: data.cart?.length || 0,
      heldAt: new Date().toISOString(),
    };

    const log = await this.salesRepo.recordAuditLog({
      organizationId,
      entityType: 'HeldCart',
      entityId: holdId,
      action: 'HOLD_CART',
      oldData: null,
      newData: heldData,
      userId: userId || null,
    });

    return {
      success: true,
      id: log.id,
      holdId,
      heldData,
    };
  }

  async getHeldCarts(organizationId: string) {
    const logs = await this.prismaManager.client.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'HeldCart',
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return logs.map((l) => ({
      id: l.id,
      ...(l.newData as any),
      createdAt: l.createdAt.toISOString(),
    }));
  }

  async deleteHeldCart(organizationId: string, idOrHoldId: string) {
    const log = await this.prismaManager.client.auditLog.findFirst({
      where: {
        organizationId,
        entityType: 'HeldCart',
        OR: [{ id: idOrHoldId }, { entityId: idOrHoldId }],
      },
    });

    if (log) {
      await this.prismaManager.client.auditLog.delete({
        where: { id: log.id },
      });
    }

    return { success: true, message: 'Held cart removed' };
  }

  async getLiveDisplayState(organizationId: string) {
    if (SalesService.liveDisplayCache[organizationId]) {
      return SalesService.liveDisplayCache[organizationId];
    }

    const config = await this.prismaManager.client.storefrontConfig.findUnique({
      where: { organizationId },
    });
    const settings = (config?.globalSettings as any) || {};
    return settings.posDisplayState || {
      status: 'IDLE_PROMO',
      items: [],
      subtotal: 0,
      discount: 0,
      grandTotal: 0,
      currency: 'BDT',
      updatedAt: new Date().toISOString(),
    };
  }

  async updateLiveDisplayState(organizationId: string, state: any) {
    const payload = {
      status: state.status || 'ACTIVE_BILLING',
      items: state.items || [],
      subtotal: Number(state.subtotal) || 0,
      discount: Number(state.discount) || 0,
      grandTotal: Number(state.grandTotal) || 0,
      currency: 'BDT',
      qrPaymentAmount: Number(state.qrPaymentAmount || state.grandTotal) || 0,
      updatedAt: new Date().toISOString(),
    };

    SalesService.liveDisplayCache[organizationId] = payload;
    return payload;
  }
}

