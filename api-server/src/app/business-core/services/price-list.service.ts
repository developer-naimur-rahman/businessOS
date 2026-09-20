import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PriceListService {
  constructor(private prisma: PrismaService) {}

  async generatePdf(organizationId: string, options: any): Promise<Buffer> {
    // 1. Fetch organization
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId }
    });

    // 2. Fetch branch if specified
    let branch = null;
    if (options.branchId) {
      branch = await this.prisma.branch.findUnique({
        where: { id: options.branchId, organizationId }
      });
    }

    // 3. Fetch services
    const whereClause: any = {
      organizationId,
      type: 'SERVICE'
    };
    if (options.includeInactive !== 'true') {
      whereClause.isActive = true;
    }

    const services = await this.prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        unit: true
      },
      orderBy: [
        { category: { displayOrder: 'asc' } },
        { category: { name: 'asc' } },
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    // 4. Group by category
    const grouped = [];
    let currentCategory = null;
    let currentGroup = null;

    for (const service of services) {
      const catName = service.category?.name || 'Uncategorized';
      if (catName !== currentCategory) {
        currentCategory = catName;
        currentGroup = {
          categoryName: catName,
          services: []
        };
        grouped.push(currentGroup);
      }
      currentGroup.services.push(service);
    }

    // 5. Generate HTML
    const html = this.buildHtml(org, branch, grouped, options);

    // 6. Generate PDF
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    
    const pdfBuffer = await page.pdf({
      format: (options.pageSize || 'A4') as puppeteer.PaperFormat,
      landscape: options.orientation === 'Landscape',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  private buildHtml(org: any, branch: any, grouped: any[], options: any): string {
    const title = options.title || 'OUR SERVICES';
    const subtitle = options.subtitle || 'PRICE LIST';
    const currency = options.currency || '৳';
    const businessName = branch?.name || org.name;
    const phone = branch?.phone || '';
    const address = branch?.address || '';

    let itemsHtml = '';
    
    for (const group of grouped) {
      if (options.showCategory !== 'false') {
        itemsHtml += `<h2 class="category-title">${group.categoryName.toUpperCase()}</h2>`;
      }
      
      itemsHtml += `<table class="price-table">`;
      for (const service of group.services) {
        itemsHtml += `
          <tr>
            <td class="service-name">
              ${service.name}
              ${options.showDescriptions === 'true' && service.description ? `<div class="service-desc">${service.description}</div>` : ''}
            </td>
            <td class="service-price">
              ${currency}${Number(service.sellingPrice)} ${options.showUnits !== 'false' && service.unit ? `<span class="unit-text">/ ${service.unit.name}</span>` : ''}
            </td>
          </tr>
        `;
      }
      itemsHtml += `</table>`;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #111;
            padding: 40px;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
          }
          .header h1 {
            font-size: 32px;
            margin: 0 0 10px 0;
            letter-spacing: 2px;
          }
          .header h2 {
            font-size: 24px;
            color: #555;
            margin: 0;
            font-weight: normal;
          }
          .business-info {
            text-align: center;
            margin-bottom: 40px;
            font-size: 14px;
            color: #666;
          }
          .category-title {
            font-size: 20px;
            border-bottom: 2px solid #222;
            padding-bottom: 5px;
            margin-top: 30px;
            margin-bottom: 15px;
            color: #222;
          }
          .price-table {
            width: 100%;
            border-collapse: collapse;
          }
          .price-table td {
            padding: 12px 0;
            border-bottom: 1px dashed #ccc;
          }
          .service-name {
            font-size: 18px;
            font-weight: 500;
          }
          .service-desc {
            font-size: 14px;
            color: #777;
            margin-top: 4px;
          }
          .service-price {
            font-size: 18px;
            font-weight: bold;
            text-align: right;
            white-space: nowrap;
          }
          .unit-text {
            font-size: 14px;
            font-weight: normal;
            color: #666;
          }
          .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 12px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <h2>${subtitle}</h2>
        </div>
        
        <div class="business-info">
          <strong>${businessName}</strong><br>
          ${options.showPhoneAddress !== 'false' && phone ? `Phone: ${phone}<br>` : ''}
          ${options.showPhoneAddress !== 'false' && address ? `${address}` : ''}
        </div>

        ${itemsHtml}

        <div class="footer">
          ${options.footerText || 'Prices may change without prior notice.'}<br>
          ${options.showDate !== 'false' ? `Generated on: ${new Date().toLocaleDateString()}` : ''}
        </div>
      </body>
      </html>
    `;
  }
}
