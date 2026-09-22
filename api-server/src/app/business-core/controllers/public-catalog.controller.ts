import { Controller, Get, Param, NotFoundException, Query, Post, Body, BadRequestException } from '@nestjs/common';
import { PrismaClient, ProductType } from '@prisma/client';
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
    const products = await this.productsService.findAll(orgId, {});
    
    // Fetch average ratings
    const reviews = await prisma.review.groupBy({
      by: ['productId'],
      where: { organizationId: orgId },
      _avg: { rating: true },
      _count: { rating: true }
    });
    const reviewMap = new Map(reviews.map(r => [r.productId, { avg: r._avg.rating || 0, count: r._count.rating }]));

    // Return only public fields
    return {
      ...products,
      items: products.items
        .filter((p: any) => p.isActive)
        .map((p: any) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          description: p.description,
          sellingPrice: p.sellingPrice,
          compareAtPrice: p.compareAtPrice,
          type: p.type,
          imageUrl: p.imageUrl,
          category: p.category ? { id: p.category.id, name: p.category.name } : null,
          rating: reviewMap.get(p.id)?.avg || 0,
          reviewCount: reviewMap.get(p.id)?.count || 0,
          variants: p.variants.map((v: any) => ({
            id: v.id,
            sku: v.sku,
            retailPrice: v.retailPrice || p.sellingPrice
          }))
        }))
    };
  }

  @Get('products/:id')
  async getPublicProduct(@Param('id') id: string) {
    const orgId = await this.getDefaultOrganizationId();
    
    // Ensure we fetch through the service to maintain boundary
    const product: any = await this.productsService.findOne(orgId, id);
    
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }

    const reviews = await prisma.review.findMany({
      where: { organizationId: orgId, productId: id },
      orderBy: { createdAt: 'desc' }
    });
    
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      description: product.description,
      type: product.type,
      sellingPrice: product.sellingPrice,
      imageUrl: product.imageUrl,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name
      } : null,
      rating: avgRating,
      reviewCount: reviews.length,
      reviews: reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        authorName: r.authorName,
        createdAt: r.createdAt
      }))
    };
  }

  @Post('products/:id/reviews')
  async createReview(
    @Param('id') id: string,
    @Body() body: { rating: number, comment?: string, orderId: string }
  ) {
    const orgId = await this.getDefaultOrganizationId();
    
    if (!body.rating || !body.orderId) {
      throw new BadRequestException('Rating and Order ID are required');
    }

    // Verify if this order contains this product
    const purchase = await prisma.sale.findFirst({
      where: {
        id: body.orderId,
        organizationId: orgId,
        status: { in: ['COMPLETED', 'DELIVERED', 'DRAFT'] }, // Temporarily allowing DRAFT for testing, normally COMPLETED
        saleLines: {
          some: {
            variant: {
              productId: id
            }
          }
        }
      },
      include: {
        customer: true
      }
    });

    if (!purchase) {
      throw new BadRequestException('Order not found or you have not purchased this product in this order.');
    }

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        organizationId: orgId,
        productId: id,
        authorName: purchase.customer?.name || 'Verified Buyer'
      }
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product.');
    }

    const review = await prisma.review.create({
      data: {
        organizationId: orgId,
        productId: id,
        rating: body.rating,
        comment: body.comment,
        authorName: purchase.customer?.name || 'Verified Buyer'
      }
    });

    return review;
  }

  @Get('categories')
  async getPublicCategories(@Query('type') type?: ProductType) {
    const orgId = await this.getDefaultOrganizationId();
    const categories = await prisma.category.findMany({
      where: { 
        organizationId: orgId,
        ...(type ? { type } : {})
      }
    });
    
    return categories.map(c => ({
      id: c.id,
      name: c.name,
      parentId: c.parentId,
      description: c.description,
      imageUrl: c.imageUrl,
      type: c.type
    }));
  }
}
