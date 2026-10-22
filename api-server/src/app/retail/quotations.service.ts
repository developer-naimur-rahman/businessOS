import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface QuotationItemDto {
  name: string;
  specs?: string;
  warrantyText?: string;
  unitPrice: number;
  quantity: number;
  total?: number;
  variantId?: string;
}

export interface CreateQuotationDto {
  customerName: string;
  customerPhone?: string;
  companyName?: string;
  validUntilDate?: string;
  category?: 'CUSTOM_PC_BUILD' | 'CCTV_SECURITY_SETUP' | 'OFFICE_EQUIPMENT' | 'PRINTING_BULK_ORDER' | 'OTHER';
  items: QuotationItemDto[];
  discountBdt?: number;
  notes?: string;
}

@Injectable()
export class QuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createQuotation(organizationId: string, userId: string | null, dto: CreateQuotationDto) {
    if (!dto.customerName || !dto.items || dto.items.length === 0) {
      throw new BadRequestException('Customer name and at least one item are required.');
    }

    const quoteNumber = `QTN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    let subtotalBdt = 0;
    const items = dto.items.map(item => {
      const price = Number(item.unitPrice || 0);
      const qty = Math.max(1, Number(item.quantity || 1));
      const lineTotal = price * qty;
      subtotalBdt += lineTotal;

      return {
        ...item,
        unitPrice: price,
        quantity: qty,
        total: lineTotal
      };
    });

    const discountBdt = Math.max(0, Number(dto.discountBdt || 0));
    const grandTotalBdt = Math.max(0, subtotalBdt - discountBdt);

    const defaultValidUntil = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const quotePayload = {
      quoteNumber,
      customerName: dto.customerName.trim(),
      customerPhone: dto.customerPhone?.trim() || null,
      companyName: dto.companyName?.trim() || null,
      validUntilDate: dto.validUntilDate || defaultValidUntil,
      category: dto.category || 'CUSTOM_PC_BUILD',
      items,
      subtotalBdt,
      discountBdt,
      grandTotalBdt,
      notes: dto.notes || 'Prices valid for 15 days from issue date. Subject to market availability.',
      status: 'DRAFT',
      createdAt: new Date().toISOString()
    };

    const record = await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        action: 'CREATE_QUOTATION',
        entityType: 'QuotationEstimate',
        entityId: quoteNumber,
        oldData: undefined,
        newData: quotePayload as any
      }
    });

    return {
      success: true,
      id: record.id,
      quoteNumber,
      customerName: dto.customerName,
      grandTotalBdt,
      status: 'DRAFT',
      message: `Quotation ${quoteNumber} created successfully.`
    };
  }

  async getQuotations(organizationId: string, status?: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'QuotationEstimate'
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    const quotes = logs.map(l => {
      const state = (l.newData as any) || {};
      return {
        id: l.id,
        createdAt: l.createdAt,
        ...state
      };
    });

    if (status && status !== 'ALL') {
      return quotes.filter(q => q.status === status);
    }
    return quotes;
  }

  async convertToSale(organizationId: string, userId: string | null, id: string) {
    const log = await this.prisma.auditLog.findFirst({
      where: { id, organizationId, entityType: 'QuotationEstimate' }
    });

    if (!log) throw new NotFoundException('Quotation not found.');

    const quote = (log.newData as any) || {};

    const updated = {
      ...quote,
      status: 'ACCEPTED_CONVERTED',
      convertedAt: new Date().toISOString()
    };

    await this.prisma.auditLog.update({
      where: { id },
      data: {
        action: 'CONVERT_QUOTATION_TO_SALE',
        newData: updated as any
      }
    });

    return {
      success: true,
      quoteNumber: quote.quoteNumber,
      message: `Quotation ${quote.quoteNumber} converted to active order!`,
      posCartItems: (quote.items || []).map((item: any) => ({
        name: `${item.name} ${item.specs ? `(${item.specs})` : ''}`,
        sellingPrice: item.unitPrice,
        quantity: item.quantity,
        variantId: item.variantId || null
      }))
    };
  }
}
