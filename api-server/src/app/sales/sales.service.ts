import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SalesRepository } from './sales.repository';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../business-core/services/products.service';
import { WarehousesService } from '../operational-structure/warehouses/warehouses.service';
import { CustomersService } from '../business-core/services/customers.service';
import { BranchesService } from '../operational-structure/branches/branches.service';
import { Prisma, PaymentMethod } from '@prisma/client';
import { PrismaClientManager } from '../common/prisma/prisma-client.manager';

export interface CreateSaleDto {
  branchId: string;
  warehouseId: string;
  customerId?: string;
  idempotencyKey?: string;
  lines: Array<{
    productId: string;
    quantity: string | number;
    discount?: string | number;
  }>;
  payments?: Array<{
    method: PaymentMethod;
    amount: string | number;
    reference?: string;
  }>;
}

@Injectable()
export class SalesService {
  constructor(
    private readonly salesRepo: SalesRepository,
    private readonly inventoryService: InventoryService,
    private readonly productsService: ProductsService,
    private readonly warehousesService: WarehousesService,
    private readonly customersService: CustomersService,
    private readonly branchesService: BranchesService,
    private readonly prismaManager: PrismaClientManager,
  ) {}

  async createDirectSale(organizationId: string, data: CreateSaleDto, userId: string) {
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
      const quantity = new Prisma.Decimal(line.quantity);
      if (quantity.lte(0)) throw new BadRequestException('Quantity must be greater than zero.');

      const product = await this.productsService.findOne(organizationId, line.productId);
      if (!product.isActive) throw new BadRequestException(`Product ${product.name} is inactive.`);

      const unitPrice = product.sellingPrice;
      const lineSubtotal = unitPrice.mul(quantity);
      const discount = line.discount ? new Prisma.Decimal(line.discount) : new Prisma.Decimal(0);
      
      if (discount.lt(0)) throw new BadRequestException('Discount cannot be negative.');
      if (discount.gt(lineSubtotal)) throw new BadRequestException('Discount cannot exceed line subtotal.');

      const lineTotal = lineSubtotal.sub(discount);
      subtotal = subtotal.add(lineTotal); // Note: this is adding to the overall subtotal of the sale (which conceptually is the sum of line totals)

      saleLinesToCreate.push({
        productId: product.id,
        quantity,
        unitPrice,
        discount,
        lineSubtotal,
        lineTotal,
      });

      if (product.type === 'PRODUCT') {
        inventoryItemsToDeduct.push({
          productId: product.id,
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
        paymentsToCreate.push({
          method: p.method,
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
}
