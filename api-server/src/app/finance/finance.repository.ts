import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma, EntryStatus, PeriodStatus } from '@prisma/client';

import { PrismaClientManager } from '../common/prisma/prisma-client.manager';

@Injectable()
export class FinanceRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prismaManager: PrismaClientManager
  ) {}

  private get client() {
    return this.prismaManager.client;
  }

  async createJournalEntry(organizationId: string, data: Prisma.JournalEntryCreateInput) {
    // Ensures the idempotency key is respected if provided
    try {
      return await this.client.journalEntry.create({
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002: Unique constraint failed
        if (error.code === 'P2002' && error.meta?.target === 'JournalEntry_idempotencyKey_key') {
          throw new ConflictException('A journal entry with this idempotency key already exists.');
        }
      }
      throw error;
    }
  }

  async findJournalEntryByIdAndOrganization(organizationId: string, id: string) {
    const entry = await this.client.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!entry || entry.organizationId !== organizationId) {
      throw new NotFoundException('Journal entry not found');
    }

    return entry;
  }

  async findFiscalPeriodByIdAndOrganization(organizationId: string, id: string) {
    const period = await this.client.fiscalPeriod.findUnique({
      where: { id },
    });

    if (!period || period.organizationId !== organizationId) {
      throw new NotFoundException('Fiscal period not found');
    }

    return period;
  }

  async getAccountByIdAndOrganization(organizationId: string, accountId: string) {
    const account = await this.client.account.findUnique({
      where: { id: accountId },
      include: { chartOfAccounts: true },
    });

    if (!account || account.chartOfAccounts.organizationId !== organizationId) {
      throw new NotFoundException(`Account ${accountId} not found in this organization`);
    }

    return account;
  }

  async findAccountsByOrganization(organizationId: string) {
    return this.client.account.findMany({
      where: { chartOfAccounts: { organizationId } },
    });
  }

  async findJournalEntriesByOrganization(organizationId: string) {
    return this.client.journalEntry.findMany({
      where: { organizationId },
      include: { lines: { include: { account: true } }, createdBy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async postJournalEntry(organizationId: string, journalId: string, userId: string) {
    const data: any = {
      status: EntryStatus.POSTED,
      postedAt: new Date(),
    };
    if (userId && userId !== 'SYSTEM') {
       data.postedBy = { connect: { id: userId } };
    }
    
    return this.client.journalEntry.update({
      where: { id: journalId },
      data,
    });
  }
}
