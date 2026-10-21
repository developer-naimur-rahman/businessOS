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
}
