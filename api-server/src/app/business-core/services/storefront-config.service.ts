import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class StorefrontConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(organizationId: string) {
    let config = await this.prisma.storefrontConfig.findUnique({
      where: { organizationId },
    });

    if (!config) {
      config = await this.prisma.storefrontConfig.create({
        data: {
          organizationId,
          serviceSlides: [],
          heroSlides: [
            {
              image: '',
              title: 'Welcome to our Store',
              subtitle: 'Discover the best products',
              buttonText: 'Shop Now',
              link: '/products'
            }
          ],
          promoBanner: {
            title: 'Special Offer',
            description: 'Get 20% off on all products',
            buttonText: 'Learn More',
            link: '/products'
          }
        },
      });
    }

    return config;
  }

  async updateConfig(organizationId: string, data: Prisma.StorefrontConfigUpdateInput) {
    return this.prisma.storefrontConfig.upsert({
      where: { organizationId },
      update: data,
      create: {
        organizationId,
          heroSlides: data.heroSlides as any,
        promoBanner: data.promoBanner as any,
        serviceSlides: data.serviceSlides as any,
        flashSaleEnd: data.flashSaleEnd as any,
      },
    });
  }
}
