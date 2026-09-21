import { Injectable, BadRequestException } from '@nestjs/common';
import { BarcodesRepository } from '../repositories/barcodes.repository';

@Injectable()
export class BarcodesService {
  constructor(private readonly repository: BarcodesRepository) {}

  async create(organizationId: string, variantId: string, barcode: string) {
    const existing = await this.repository.findByBarcode(organizationId, barcode);
    if (existing) {
      throw new BadRequestException(`Barcode ${barcode} is already in use.`);
    }
    return this.repository.create(organizationId, variantId, barcode);
  }

  async lookup(organizationId: string, barcode: string) {
    return this.repository.findByBarcode(organizationId, barcode);
  }

  async setStatus(organizationId: string, barcode: string, isActive: boolean) {
    return this.repository.setStatus(organizationId, barcode, isActive);
  }

  async delete(organizationId: string, barcode: string) {
    return this.repository.delete(organizationId, barcode);
  }
}
