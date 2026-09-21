import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as puppeteer from 'puppeteer';

function validateDesignState(settings: any) {
  if (!settings || typeof settings !== 'object') {
    throw new BadRequestException('Invalid DesignState: Must be an object');
  }
  if (!settings.templateId || typeof settings.templateId !== 'string') {
    throw new BadRequestException('Invalid DesignState: Missing or invalid templateId');
  }
  if (!settings.content || typeof settings.content !== 'object') {
    throw new BadRequestException('Invalid DesignState: Missing content object');
  }
  if (!settings.colors || typeof settings.colors !== 'object') {
    throw new BadRequestException('Invalid DesignState: Missing colors object');
  }
  if (!settings.typography || typeof settings.typography !== 'object') {
    throw new BadRequestException('Invalid DesignState: Missing typography object');
  }
  if (!settings.layout || typeof settings.layout !== 'object') {
    throw new BadRequestException('Invalid DesignState: Missing layout object');
  }
}

@Injectable()
export class DesignStudioService {
  constructor(private prisma: PrismaService) {}

  async getDesigns(organizationId: string) {
    return this.prisma.bannerDesign.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async createDesign(organizationId: string, data: any) {
    let settings = data.settings || {};
    
    validateDesignState(settings);

    if (data.serviceIds && Array.isArray(data.serviceIds)) {
      settings = await this.injectServiceSnapshots(organizationId, settings, data.serviceIds);
    } else if (settings.services && Array.isArray(settings.services)) {
      // already has valid snapshot array
    } else {
      settings.services = [];
    }

    return this.prisma.bannerDesign.create({
      data: {
        organizationId,
        name: data.name,
        type: data.type,
        width: data.width,
        height: data.height,
        unit: data.unit,
        template: data.template,
        settings,
      }
    });
  }

  async updateDesign(organizationId: string, id: string, data: any) {
    const design = await this.prisma.bannerDesign.findUnique({ where: { id } });
    if (!design) throw new NotFoundException('Design not found');
    if (design.organizationId !== organizationId) throw new ForbiddenException();

    let settings = data.settings !== undefined ? data.settings : design.settings;
    
    if (data.settings !== undefined) {
      validateDesignState(settings);
    }

    if (data.serviceIds && Array.isArray(data.serviceIds) && data.refreshPrices) {
      // Force refresh of snapshots if requested
      settings = await this.injectServiceSnapshots(organizationId, settings, data.serviceIds);
    } else if (data.settings && data.settings.services && Array.isArray(data.settings.services)) {
      // Already has valid services list in state
    }

    return this.prisma.bannerDesign.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : design.name,
        type: data.type !== undefined ? data.type : design.type,
        width: data.width !== undefined ? data.width : design.width,
        height: data.height !== undefined ? data.height : design.height,
        unit: data.unit !== undefined ? data.unit : design.unit,
        template: data.template !== undefined ? data.template : design.template,
        settings,
      }
    });
  }

  private async injectServiceSnapshots(organizationId: string, settings: any, serviceIds: string[]) {
    const products = await this.prisma.product.findMany({
      where: { organizationId, id: { in: serviceIds } },
      include: { unit: true, category: true }
    });
    const snapshot = products.map((p, idx) => ({
      serviceId: p.id,
      name: p.name,
      price: Number(p.sellingPrice),
      unit: p.unit?.name || null,
      categoryName: p.category?.name || 'Uncategorized',
      displayOrder: idx,
      description: p.description || null,
      imageUrl: p.imageUrl || null
    }));

    return {
      ...settings,
      services: snapshot
    };
  }

  async deleteDesign(organizationId: string, id: string) {
    const design = await this.prisma.bannerDesign.findUnique({ where: { id } });
    if (!design) throw new NotFoundException();
    if (design.organizationId !== organizationId) throw new ForbiddenException();

    return this.prisma.bannerDesign.delete({ where: { id } });
  }

  async duplicateDesign(organizationId: string, id: string) {
    const design = await this.prisma.bannerDesign.findUnique({ where: { id } });
    if (!design) throw new NotFoundException();
    if (design.organizationId !== organizationId) throw new ForbiddenException();

    return this.prisma.bannerDesign.create({
      data: {
        organizationId: design.organizationId,
        branchId: design.branchId,
        name: `${design.name} (Copy)`,
        type: design.type,
        width: design.width,
        height: design.height,
        unit: design.unit,
        template: design.template,
        settings: design.settings,
      }
    });
  }

  async generatePdf(organizationId: string, id: string): Promise<Buffer> {
    const design = await this.prisma.bannerDesign.findUnique({ where: { id } });
    if (!design) throw new NotFoundException();
    if (design.organizationId !== organizationId) throw new ForbiddenException();

    // Convert dimensions to inches for PDF generation
    let widthInInches = Number(design.width);
    let heightInInches = Number(design.height);

    if (design.unit === 'FT') {
      widthInInches *= 12;
      heightInInches *= 12;
    } else if (design.unit === 'CM') {
      widthInInches /= 2.54;
      heightInInches /= 2.54;
    } else if (design.unit === 'MM') {
      widthInInches /= 25.4;
      heightInInches /= 25.4;
    }

    // Since we need to reuse the frontend template design without duplicating logic,
    // we will fetch the rendered HTML from a special print endpoint on the frontend.
    // In a real production setup, FRONTEND_URL would be used. 
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const printUrl = `${frontendUrl}/print/banner/${id}?orgId=${organizationId}`;

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    // We navigate to the print URL. The page must be designed to load data and render
    await page.goto(printUrl, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      width: `${widthInInches}in`,
      height: `${heightInInches}in`,
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      pageRanges: '1'
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  }
}
