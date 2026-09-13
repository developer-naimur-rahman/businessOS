import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { OutboxStatus, Prisma } from '@prisma/client';
import { PrismaClientManager } from '../common/prisma/prisma-client.manager';

@Injectable()
export class FinanceIntegrationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prismaManager: PrismaClientManager,
  ) {}

  private get client() {
    return this.prismaManager.client;
  }

  async getConfig(organizationId: string) {
    return this.client.financeIntegrationConfig.findUnique({
      where: { organizationId },
    });
  }

  async createConfig(organizationId: string, data: Omit<Prisma.FinanceIntegrationConfigCreateInput, 'organization'>) {
    return this.client.financeIntegrationConfig.upsert({
      where: { organizationId },
      create: {
        organization: { connect: { id: organizationId } },
        ...data,
      },
      update: data,
    });
  }

  /**
   * Safely claims a pending outbox event for processing.
   * This uses an atomic update to prevent concurrent workers from claiming the same event.
   */
  async claimNextPendingEvent(organizationId?: string) {
    const whereClause: Prisma.OutboxEventWhereInput = {
      status: OutboxStatus.PENDING,
      availableAt: { lte: new Date() },
    };

    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    const pendingEvents = await this.client.outboxEvent.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    for (const event of pendingEvents) {
      // Try atomic claim
      const updated = await this.client.outboxEvent.updateMany({
        where: {
          id: event.id,
          status: OutboxStatus.PENDING, // Must still be PENDING
        },
        data: {
          status: OutboxStatus.PROCESSING,
          processingStartedAt: new Date(),
          attempts: { increment: 1 },
        },
      });

      if (updated.count > 0) {
        // Successfully claimed
        return this.client.outboxEvent.findUnique({ where: { id: event.id } });
      }
    }

    return null; // Nothing claimed
  }

  async markEventCompleted(id: string) {
    return this.client.outboxEvent.update({
      where: { id },
      data: {
        status: OutboxStatus.COMPLETED,
        processedAt: new Date(),
        processingStartedAt: null,
      },
    });
  }

  async markEventFailed(id: string, error: string, retryable: boolean, nextRetryAt?: Date) {
    return this.client.outboxEvent.update({
      where: { id },
      data: {
        status: retryable ? OutboxStatus.PENDING : OutboxStatus.FAILED,
        lastError: error,
        processingStartedAt: null,
        availableAt: nextRetryAt || new Date(), // If retryable, when should it be retried?
      },
    });
  }

  /**
   * Recovers events that have been in PROCESSING state for too long (e.g., worker crashed).
   */
  async recoverStaleProcessingEvents(staleThresholdMinutes = 5) {
    const staleDate = new Date(Date.now() - staleThresholdMinutes * 60 * 1000);
    
    const result = await this.client.outboxEvent.updateMany({
      where: {
        status: OutboxStatus.PROCESSING,
        processingStartedAt: { lt: staleDate },
      },
      data: {
        status: OutboxStatus.PENDING,
        processingStartedAt: null,
        lastError: 'Recovered from stale PROCESSING state',
      },
    });

    return result.count;
  }
}
