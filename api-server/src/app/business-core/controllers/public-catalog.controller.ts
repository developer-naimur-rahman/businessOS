import { Controller, Get, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ProductsService } from '../services/products.service';

const prisma = new PrismaClient();

@Controller('public/catalog')
export class PublicCatalogController {
  constructor(private readonly productsService: ProductsService) {}

  // Helper method to resolve the single-tenant organization ID safely server-side
  private async getDefaultOrganizationId(): Promise<string> {
    const org = await prisma.organization.findFirst();
    if (!org) {
      throw new NotFoundException('Storefront organization not configured.');
    }
    return org.id;
  }

  @Get('products')
  async getPublicProducts() {
    const orgId = await this.getDefaultOrganizationId();
    
    // Use the existing service logic but filter/map to a public DTO
    const products = await this.productsService.findAll(orgId);
    
    // Return only public fields
    return products
      .filter(p => p.isActive)
      .map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        type: p.type,
        sellingPrice: p.sellingPrice,
        category: p.category ? {
          id: p.category.id,
          name: p.category.name
        } : null
      }));
  }

  @Get('categories')
  async getPublicCategories() {
    const orgId = await this.getDefaultOrganizationId();
    const categories = await prisma.category.findMany({
      where: { organizationId: orgId }
    });
    
    return categories.map(c => ({
      id: c.id,
      name: c.name,
      parentId: c.parentId,
      description: c.description
    }));
  }
}
