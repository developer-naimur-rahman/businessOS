import { Injectable, Logger } from '@nestjs/common';
import { PrismaClientManager } from '../common/prisma/prisma-client.manager';
import { AccessTier } from '@prisma/client';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly prismaManager: PrismaClientManager) {}

  /**
   * Creates a new unattached StorageObject representing an uploaded file.
   */
  async createUnattachedUpload(
    organizationId: string,
    data: {
      filename: string;
      mimeType: string;
      sizeBytes: number;
      storageKey: string;
      accessType?: AccessTier;
      customerId?: string;
    }
  ) {
    const prisma = this.prismaManager.client as any;
    return prisma.storageObject.create({
      data: {
        organizationId,
        filename: data.filename,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        storageKey: data.storageKey,
        accessType: data.accessType || 'PRIVATE_CUSTOMER',
        customerId: data.customerId,
      },
    });
  }

  /**
   * Links a StorageObject to a SaleLine during checkout.
   */
  async attachToSaleLine(
    organizationId: string,
    storageObjectId: string,
    saleLineId: string
  ) {
    const prisma = this.prismaManager.client as any;
    
    const obj = await prisma.storageObject.findUnique({
      where: { id: storageObjectId },
    });

    if (!obj || obj.organizationId !== organizationId) {
      throw new Error('StorageObject not found or unauthorized');
    }

    if (obj.saleLineId) {
      throw new Error('StorageObject is already attached to a SaleLine');
    }

    return prisma.storageObject.update({
      where: { id: storageObjectId },
      data: { saleLineId },
    });
  }

  /**
   * Cleans up orphaned objects (unattached for > 24 hours).
   * Intended to be run by a scheduler.
   */
  async cleanupOrphanedObjects() {
    const prisma = this.prismaManager.client as any;
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    try {
      const orphaned = await prisma.storageObject.findMany({
        where: {
          saleLineId: null,
          createdAt: {
            lt: yesterday,
          },
        },
      });

      if (orphaned.length > 0) {
        this.logger.log(`Found ${orphaned.length} orphaned StorageObjects to clean up`);
        
        // In a full implementation, you would also delete the file from S3 here
        // for (const obj of orphaned) {
        //   await this.s3Provider.delete(obj.storageKey);
        // }

        const deleteResult = await prisma.storageObject.deleteMany({
          where: {
            id: { in: orphaned.map(o => o.id) }
          }
        });
        
        this.logger.log(`Deleted ${deleteResult.count} orphaned StorageObjects from database`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup orphaned storage objects', error);
    }
  }
}
