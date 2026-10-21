import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaClientManager } from '../common/prisma/prisma-client.manager';

export interface ServiceConfigSchemaField {
  key: string;
  type: 'select' | 'number' | 'text' | 'textarea' | 'boolean' | 'file';
  label: string;
  required?: boolean;
  min?: number;
  max?: number;
  isUnitMultiplier?: boolean;
  options?: Array<{
    value: string;
    label: string;
    priceDelta?: {
      type: 'FIXED' | 'PER_UNIT';
      value: number;
    };
  }>;
}

export interface ServiceConfigSchema {
  fields: ServiceConfigSchemaField[];
}

export interface QuoteResult {
  basePrice: Prisma.Decimal;
  unitMultiplier: Prisma.Decimal;
  modifiersTotal: Prisma.Decimal;
  finalUnitPrice: Prisma.Decimal;
  quantity: Prisma.Decimal;
  finalLineTotal: Prisma.Decimal;
  normalizedConfiguration: Record<string, any>;
}

@Injectable()
export class QuoteEngineService {
  constructor(private readonly prismaManager: PrismaClientManager) {}

  /**
   * Calculates a deterministic quote for a service based on its schema and chosen configuration.
   * Performs database lookups to strictly validate Organization, Product, and Variant ownership.
   */
  async calculateQuote(
    organizationId: string,
    productId: string,
    variantId: string,
    submittedConfig: Record<string, any>,
    quantity: Prisma.Decimal | string | number
  ): Promise<QuoteResult> {
    const prisma = this.prismaManager.client as PrismaClient;

    // 1. Fetch Product and Variant, ensuring organization scope
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        organizationId,
      },
      include: {
        variants: {
          where: {
            id: variantId,
            organizationId, // Double check variant org ownership
          }
        }
      }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.type !== 'SERVICE') {
      throw new BadRequestException('Pricing engine only supports SERVICE products');
    }

    if (product.variants.length === 0) {
      throw new BadRequestException('Invalid variant or variant does not belong to this product');
    }

    const variant = product.variants[0];
    
    if (variant.status !== 'ACTIVE') {
      throw new BadRequestException('Selected variant is not active');
    }

    const qty = new Prisma.Decimal(quantity);
    if (qty.lte(0)) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    const basePrice = variant.retailPrice;
    const schema = product.serviceConfigSchema as any as ServiceConfigSchema | null;
    
    // If there is no schema, it's a fixed-price service
    if (!schema || !schema.fields || schema.fields.length === 0) {
      return {
        basePrice,
        unitMultiplier: new Prisma.Decimal(1),
        modifiersTotal: new Prisma.Decimal(0),
        finalUnitPrice: basePrice,
        quantity: qty,
        finalLineTotal: basePrice.mul(qty),
        normalizedConfiguration: {},
      };
    }

    let unitMultiplier = new Prisma.Decimal(1);
    let modifiersTotal = new Prisma.Decimal(0);
    const normalizedConfiguration: Record<string, any> = {};

    // 1. Identify unit multiplier
    const multiplierFields = schema.fields.filter(f => f.isUnitMultiplier);
    if (multiplierFields.length > 1) {
      throw new BadRequestException('Schema cannot have more than one unit multiplier field');
    }
    
    const multiplierField = multiplierFields[0];
    if (multiplierField) {
      const submittedValue = submittedConfig[multiplierField.key];
      if (submittedValue !== undefined && submittedValue !== null) {
        // Validate number
        const val = new Prisma.Decimal(submittedValue);
        if (multiplierField.min !== undefined && val.lt(multiplierField.min)) {
          throw new BadRequestException(`Field ${multiplierField.key} must be at least ${multiplierField.min}`);
        }
        if (multiplierField.max !== undefined && val.gt(multiplierField.max)) {
          throw new BadRequestException(`Field ${multiplierField.key} must be at most ${multiplierField.max}`);
        }
        unitMultiplier = val;
      }
    }

    // 2. Validate all fields and calculate modifiers
    for (const field of schema.fields) {
      const submittedValue = submittedConfig[field.key];
      
      if (field.required && (submittedValue === undefined || submittedValue === null || submittedValue === '')) {
        throw new BadRequestException(`Missing required field: ${field.key}`);
      }

      if (submittedValue !== undefined && submittedValue !== null) {
        if (field.type === 'select') {
          const option = field.options?.find(o => o.value === submittedValue);
          if (!option) {
            throw new BadRequestException(`Invalid option for field ${field.key}: ${submittedValue}`);
          }
          
          normalizedConfiguration[field.key] = option.value;

          if (option.priceDelta) {
            const deltaValue = new Prisma.Decimal(option.priceDelta.value);
            if (option.priceDelta.type === 'FIXED') {
              modifiersTotal = modifiersTotal.add(deltaValue);
            } else if (option.priceDelta.type === 'PER_UNIT') {
              modifiersTotal = modifiersTotal.add(deltaValue.mul(unitMultiplier));
            }
          }
        } else if (field.type === 'number') {
          const numVal = new Prisma.Decimal(submittedValue);
          if (field.min !== undefined && numVal.lt(field.min)) {
            throw new BadRequestException(`Field ${field.key} must be at least ${field.min}`);
          }
          if (field.max !== undefined && numVal.gt(field.max)) {
            throw new BadRequestException(`Field ${field.key} must be at most ${field.max}`);
          }
          normalizedConfiguration[field.key] = numVal.toNumber();
        } else {
          // boolean, text, textarea, file
          normalizedConfiguration[field.key] = submittedValue;
        }
      }
    }

    // Ensure no unknown fields
    for (const key of Object.keys(submittedConfig)) {
      if (!schema.fields.find(f => f.key === key)) {
        throw new BadRequestException(`Unknown configuration field: ${key}`);
      }
    }

    const finalUnitPrice = basePrice.add(modifiersTotal);
    const finalLineTotal = finalUnitPrice.mul(qty);

    return {
      basePrice,
      unitMultiplier,
      modifiersTotal,
      finalUnitPrice,
      quantity: qty,
      finalLineTotal,
      normalizedConfiguration,
    };
  }
}
