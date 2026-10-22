import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.interface';

export interface BarcodeItemRequest {
  productId: string;
  variantId?: string;
  copies: number;
  showBrandName?: boolean;
  showPrice?: boolean;
  showMrpDiscount?: boolean;
  showVariantAttributes?: boolean;
}

export interface BarcodeStudioPreset {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  labelCountPerSheet?: number;
  type: 'THERMAL_ROLL' | 'LASER_A4';
  description: string;
}

@Controller('admin/barcode-studio')
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class BarcodeStudioController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('presets')
  async getPresets() {
    const presets: BarcodeStudioPreset[] = [
      {
        id: '38x25mm',
        name: '38x25mm (1.5" x 1")',
        widthMm: 38,
        heightMm: 25,
        type: 'THERMAL_ROLL',
        description: 'Standard retail price sticker for stationery, small gadgets & cosmetics',
      },
      {
        id: '50x30mm',
        name: '50x30mm (2" x 1.2")',
        widthMm: 50,
        heightMm: 30,
        type: 'THERMAL_ROLL',
        description: 'Apparel hangtag & electronics box label with price, SKU & barcode',
      },
      {
        id: '40x60mm',
        name: '40x60mm (1.6" x 2.4")',
        widthMm: 40,
        heightMm: 60,
        type: 'THERMAL_ROLL',
        description: 'Warehouse bin & shelf label with large readable barcode & attributes',
      },
      {
        id: 'A4_SHEET_40',
        name: 'A4 Laser Sheet (40 Labels)',
        widthMm: 48.5,
        heightMm: 25.4,
        labelCountPerSheet: 40,
        type: 'LASER_A4',
        description: '4x10 grid on standard A4 sticker paper for regular laser/inkjet printers',
      },
    ];

    return { presets };
  }

  @Post('generate-batch')
  async generateBatch(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { items: BarcodeItemRequest[]; presetId?: string },
  ) {
    const org = await this.prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    const storeName = org?.name || 'My Business OS';
    const generatedLabels = [];

    for (const item of body.items || []) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!product) continue;

      const variant = item.variantId 
        ? product.variants.find(v => v.id === item.variantId) || product.variants[0]
        : product.variants[0];

      const sku = variant?.sku || product.code || `SKU-${product.id.substring(0, 6)}`;
      const price = Number(variant?.retailPrice || product.sellingPrice || 0);
      const comparePrice = product.compareAtPrice ? Number(product.compareAtPrice) : 0;
      const copies = Math.max(1, Math.min(100, item.copies || 1));

      for (let i = 0; i < copies; i++) {
        generatedLabels.push({
          id: `${product.id}-${i}`,
          storeName,
          productTitle: product.name,
          variantName: '',
          sku,
          price,
          comparePrice: comparePrice > price ? comparePrice : null,
          barcodeCode128: sku.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'PROD1234',
          showBrandName: item.showBrandName !== false,
          showPrice: item.showPrice !== false,
          showMrpDiscount: item.showMrpDiscount !== false,
          showVariantAttributes: item.showVariantAttributes !== false,
        });
      }
    }

    return {
      success: true,
      totalLabels: generatedLabels.length,
      presetId: body.presetId || '38x25mm',
      labels: generatedLabels,
    };
  }
}
