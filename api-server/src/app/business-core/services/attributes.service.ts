import { Injectable, BadRequestException } from '@nestjs/common';
import { AttributesRepository } from '../repositories/attributes.repository';
import * as crypto from 'crypto';

@Injectable()
export class AttributesService {
  constructor(private readonly repository: AttributesRepository) {}

  async createAttribute(organizationId: string, name: string) {
    const canonicalName = name.trim();
    if (!canonicalName) throw new BadRequestException('Attribute name is required');
    
    const existing = await this.repository.findAttributeByName(organizationId, canonicalName);
    if (existing) {
      throw new BadRequestException(`Attribute ${canonicalName} already exists.`);
    }
    return this.repository.createAttribute(organizationId, canonicalName);
  }

  async createAttributeValue(organizationId: string, attributeId: string, value: string) {
    const canonicalValue = value.trim();
    if (!canonicalValue) throw new BadRequestException('Attribute value is required');
    
    const existing = await this.repository.findAttributeValueByValue(organizationId, attributeId, canonicalValue);
    if (existing) {
      return existing; // Idempotent
    }
    return this.repository.createAttributeValue(organizationId, attributeId, canonicalValue);
  }

  async findAll(organizationId: string) {
    return this.repository.findAll(organizationId);
  }

  static calculateAttributeHash(values: { attributeId: string; valueId: string }[]): string {
    // 5. sort deterministically (by attributeId)
    const sorted = [...values].sort((a, b) => a.attributeId.localeCompare(b.attributeId));
    // 6. calculate attributeHash
    const str = sorted.map(v => `${v.attributeId}:${v.valueId}`).join('|');
    return crypto.createHash('sha256').update(str).digest('hex');
  }
}
