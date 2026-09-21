import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PurchasesRepository } from '../repositories/purchases.repository';
import { CreatePurchaseDto, UpdatePurchaseDto, AddPurchasePaymentDto } from '../dto/purchase.dto';
import { PurchaseStatus, Prisma } from '@prisma/client';
import { SuppliersRepository } from '../../business-core/repositories/suppliers.repository';
import { WarehousesService } from '../../operational-structure/warehouses/warehouses.service';
import { BranchesService } from '../../operational-structure/branches/branches.service';
import { VariantsService } from '../../business-core/services/variants.service';
import { InventoryService } from '../../inventory/inventory.service';
import { PrismaClientManager } from '../../common/prisma/prisma-client.manager';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly repo: PurchasesRepository,
    private readonly suppliersRepo: SuppliersRepository,
    private readonly warehousesService: WarehousesService,
    private readonly branchesService: BranchesService,
    private readonly variantsService: VariantsService,
    private readonly inventoryService: InventoryService,
    private readonly prismaManager: PrismaClientManager,
  ) {}

  async createDraft(organizationId: string, userId: string, dto: CreatePurchaseDto) {
    await this.validateDependencies(organizationId, dto);

    const { subtotal, totalDiscount, total, parsedLines } = await this.calculateTotalsAndLines(organizationId, dto);

    return this.repo.create(organizationId, {
      organization: { connect: { id: organizationId } },
      supplier: { connect: { organizationId_id: { organizationId, id: dto.supplierId } } },
      warehouse: { connect: { organizationId_id: { organizationId, id: dto.warehouseId } } },
      branch: dto.branchId ? { connect: { organizationId_id: { organizationId, id: dto.branchId } } } : undefined,
      purchaseDate: new Date(dto.purchaseDate),
      subtotal,
      totalDiscount,
      total,
      status: PurchaseStatus.DRAFT,
      lines: {
        create: parsedLines,
      },
    });
  }

  async updateDraft(organizationId: string, id: string, dto: UpdatePurchaseDto) {
    const existing = await this.repo.findOneWithDetails(organizationId, id);
    if (!existing) throw new NotFoundException('Purchase not found');
    if (existing.status !== PurchaseStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT purchases can be edited.');
    }

    await this.validateDependencies(organizationId, dto);
    const { subtotal, totalDiscount, total, parsedLines } = await this.calculateTotalsAndLines(organizationId, dto);

    // Delete old lines and replace with new ones
    return this.repo.runTransaction(async () => {
      await this.prismaManager.client.purchaseLine.deleteMany({
        where: { purchaseId: id, organizationId },
      });

      return this.repo.update(organizationId, id, {
        supplier: { connect: { organizationId_id: { organizationId, id: dto.supplierId } } },
        warehouse: { connect: { organizationId_id: { organizationId, id: dto.warehouseId } } },
        branch: dto.branchId ? { connect: { organizationId_id: { organizationId, id: dto.branchId } } } : undefined,
        purchaseDate: new Date(dto.purchaseDate),
        subtotal,
        totalDiscount,
        total,
        lines: {
          create: parsedLines,
        },
      });
    });
  }

  async completePurchase(organizationId: string, id: string, userId: string) {
    const purchase = await this.repo.findOneWithDetails(organizationId, id);
    if (!purchase) throw new NotFoundException('Purchase not found');
    if (purchase.status === PurchaseStatus.COMPLETED) {
      throw new BadRequestException('Purchase is already completed.');
    }

    return this.repo.runTransaction(async () => {
      // 1. Mark completed
      const updated = await this.repo.update(organizationId, id, { status: PurchaseStatus.COMPLETED });

      // 2. Receive inventory (and calculate WAC)
      const receiptItems = purchase.lines.map(line => ({
        variantId: line.variantId,
        quantity: line.quantity,
        unitCost: line.unitCost,
      }));

      await this.inventoryService.createReceipt(
        organizationId,
        purchase.warehouseId,
        receiptItems,
        purchase.id,
        userId,
        `PURCHASE-RECEIPT-${purchase.id}`
      );

      // 3. Finance Outbox Event
      await this.prismaManager.client.outboxEvent.create({
        data: {
          organizationId,
          eventType: 'PURCHASE_COMPLETED',
          aggregateType: 'Purchase',
          aggregateId: purchase.id,
          payload: { purchaseId: purchase.id },
          status: 'PENDING',
        }
      });

      return updated;
    });
  }

  async addPayment(organizationId: string, id: string, dto: AddPurchasePaymentDto) {
    const purchase = await this.repo.findOneWithDetails(organizationId, id);
    if (!purchase) throw new NotFoundException('Purchase not found');
    if (purchase.status !== PurchaseStatus.COMPLETED) {
      throw new BadRequestException('Payments can only be added to COMPLETED purchases.');
    }

    const currentPaid = purchase.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const newTotalPaid = currentPaid + dto.amount;
    if (newTotalPaid > Number(purchase.total) + 0.01) { // 0.01 for rounding
      throw new BadRequestException('Payment exceeds outstanding balance.');
    }

    return this.repo.runTransaction(async () => {
      const payment = await this.repo.addPayment(organizationId, {
        organization: { connect: { id: organizationId } },
        purchase: { connect: { id } },
        amount: dto.amount,
        method: dto.method,
        reference: dto.reference,
        paymentDate: new Date(dto.paymentDate),
      });

      await this.prismaManager.client.outboxEvent.create({
        data: {
          organizationId,
          eventType: 'PURCHASE_PAYMENT',
          aggregateType: 'Purchase',
          aggregateId: payment.id,
          payload: { purchasePaymentId: payment.id },
          status: 'PENDING',
        }
      });

      return payment;
    });
  }

  async findMany(organizationId: string, params: any) {
    return this.repo.findMany(organizationId, params);
  }

  async findOne(organizationId: string, id: string) {
    const purchase = await this.repo.findOneWithDetails(organizationId, id);
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  private async validateDependencies(organizationId: string, dto: CreatePurchaseDto | UpdatePurchaseDto) {
    const supplier = await this.suppliersRepo.findByIdAndOrganization(organizationId, dto.supplierId);
    if (!supplier || supplier.status !== 'ACTIVE') {
      throw new BadRequestException('Supplier is invalid or inactive.');
    }

    const warehouse = await this.warehousesService.findOne(organizationId, dto.warehouseId);
    if (!warehouse.isActive) {
      throw new BadRequestException('Warehouse is inactive.');
    }
    if (dto.branchId && warehouse.branchId !== dto.branchId) {
      throw new BadRequestException('Warehouse does not belong to the selected branch.');
    }

    if (dto.branchId) {
      const branch = await this.branchesService.findOne(organizationId, dto.branchId);
      if (!branch.isActive) {
        throw new BadRequestException('Branch is inactive.');
      }
    }
  }

  private async calculateTotalsAndLines(organizationId: string, dto: CreatePurchaseDto | UpdatePurchaseDto) {
    let subtotal = new Prisma.Decimal(0);
    const parsedLines = [];

    for (const line of dto.lines) {
      const variant = await this.variantsService.findOne(organizationId, line.variantId);
      if (!variant) throw new NotFoundException(`Variant ${line.variantId} not found`);
      
      const product = await this.prismaManager.client.product.findUnique({ where: { organizationId_id: { organizationId, id: variant.productId } } });
      if (!product) throw new NotFoundException(`Product for variant ${line.variantId} not found`);
      if (product.type === 'SERVICE') {
        throw new BadRequestException(`Variant ${line.variantId} is a SERVICE and cannot be purchased into inventory.`);
      }

      const qty = new Prisma.Decimal(line.quantity);
      const unitCost = new Prisma.Decimal(line.unitCost);
      const discount = new Prisma.Decimal(line.discount || 0);

      const lineSubtotal = qty.times(unitCost);
      const lineTotal = lineSubtotal.minus(discount);

      if (lineTotal.lessThan(0)) {
        throw new BadRequestException(`Line total cannot be negative for variant ${line.variantId}`);
      }

      subtotal = subtotal.plus(lineSubtotal);

      parsedLines.push({
        organization: { connect: { id: organizationId } },
        variant: { connect: { organizationId_id: { organizationId, id: line.variantId } } },
        quantity: qty,
        unitCost: unitCost,
        discount: discount,
        lineSubtotal,
        lineTotal,
        productNameSnapshot: product.name,
        skuSnapshot: variant.sku,
      });
    }

    const totalDiscount = new Prisma.Decimal(dto.totalDiscount || 0);
    const total = subtotal.minus(totalDiscount);

    if (total.lessThan(0)) {
      throw new BadRequestException('Total purchase amount cannot be negative.');
    }

    return { subtotal, totalDiscount, total, parsedLines };
  }
}
