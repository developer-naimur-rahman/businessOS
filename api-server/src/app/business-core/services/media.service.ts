import { Injectable, BadRequestException } from '@nestjs/common';
import { MediaRepository } from '../repositories/media.repository';
import { VariantsRepository } from '../repositories/variants.repository';
import { ProductsRepository } from '../repositories/products.repository';

@Injectable()
export class MediaService {
  constructor(
    private readonly repository: MediaRepository,
    private readonly variantsRepo: VariantsRepository,
    private readonly productsRepo: ProductsRepository,
  ) {}

  async create(organizationId: string, data: any) {
    // Verify product exists
    await this.productsRepo.findByIdAndOrganization(organizationId, data.productId);

    if (data.variantId) {
      // Verify variant belongs to this org and product
      const variant = await this.variantsRepo.findByIdAndOrganization(organizationId, data.variantId);
      if (variant.productId !== data.productId) {
        throw new BadRequestException('Variant does not belong to the specified product');
      }
    }

    return this.repository.create(organizationId, data);
  }

  async findByProduct(organizationId: string, productId: string) {
    return this.repository.findByProduct(organizationId, productId);
  }

  async setPrimary(organizationId: string, productId: string, mediaId: string) {
    // Verify product exists
    await this.productsRepo.findByIdAndOrganization(organizationId, productId);
    return this.repository.setPrimary(organizationId, productId, mediaId);
  }

  async delete(organizationId: string, id: string) {
    return this.repository.delete(organizationId, id);
  }
}
