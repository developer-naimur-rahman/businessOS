import { Injectable, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { FinanceRepository } from './finance.repository';
import { EntryStatus, PeriodStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateJournalLineDto {
  accountId: string;
  debit?: number | string | Decimal;
  credit?: number | string | Decimal;
  businessUnitId?: string;
  branchId?: string;
  departmentId?: string;
  projectId?: string;
}

export interface CreateJournalEntryDto {
  accountingDate: Date;
  referenceType?: string;
  referenceId?: string;
  idempotencyKey?: string;
  description?: string;
  fiscalPeriodId?: string;
  lines: CreateJournalLineDto[];
}

@Injectable()
export class FinanceService {
  constructor(private readonly financeRepository: FinanceRepository) {}

  async getAccounts(organizationId: string) {
    return this.financeRepository.findAccountsByOrganization(organizationId);
  }

  async getJournalEntries(organizationId: string) {
    return this.financeRepository.findJournalEntriesByOrganization(organizationId);
  }

  async createDraftJournalEntry(
    organizationId: string, 
    userId: string, 
    data: CreateJournalEntryDto
  ) {
    this.validateJournalLines(data.lines);

    // Verify fiscal period if provided
    if (data.fiscalPeriodId) {
      const period = await this.financeRepository.findFiscalPeriodByIdAndOrganization(organizationId, data.fiscalPeriodId);
      if (period.status !== PeriodStatus.OPEN) {
        throw new BadRequestException('Cannot create entry in a closed or locked fiscal period');
      }
    }

    // Verify all accounts belong to the organization
    for (const line of data.lines) {
      await this.financeRepository.getAccountByIdAndOrganization(organizationId, line.accountId);
    }

    const entry = await this.financeRepository.createJournalEntry(organizationId, {
      organization: { connect: { id: organizationId } },
      ...(userId && userId !== 'SYSTEM' ? { createdBy: { connect: { id: userId } } } : {}),
      accountingDate: data.accountingDate,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      idempotencyKey: data.idempotencyKey,
      description: data.description,
      status: EntryStatus.DRAFT,
      ...(data.fiscalPeriodId ? { fiscalPeriod: { connect: { id: data.fiscalPeriodId } } } : {}),
      lines: {
        create: data.lines.map(line => ({
          account: { connect: { id: line.accountId } },
          debit: new Decimal(line.debit || 0),
          credit: new Decimal(line.credit || 0),
          ...(line.businessUnitId ? { businessUnit: { connect: { id: line.businessUnitId } } } : {}),
          ...(line.branchId ? { branch: { connect: { id: line.branchId } } } : {}),
          ...(line.departmentId ? { department: { connect: { id: line.departmentId } } } : {}),
          ...(line.projectId ? { project: { connect: { id: line.projectId } } } : {}),
        })),
      },
    });

    return entry;
  }

  async postJournalEntry(organizationId: string, journalId: string, userId: string) {
    const entry = await this.financeRepository.findJournalEntryByIdAndOrganization(organizationId, journalId);

    if (entry.status !== EntryStatus.DRAFT) {
      throw new BadRequestException(`Journal entry is already ${entry.status} and cannot be posted`);
    }

    if (entry.fiscalPeriodId) {
      const period = await this.financeRepository.findFiscalPeriodByIdAndOrganization(organizationId, entry.fiscalPeriodId);
      if (period.status !== PeriodStatus.OPEN) {
        throw new BadRequestException('Cannot post entry into a closed or locked fiscal period');
      }
    }

    // Re-validate balance before posting to ensure integrity
    this.validateJournalLines(entry.lines);

    return this.financeRepository.postJournalEntry(organizationId, journalId, userId);
  }

  private validateJournalLines(lines: any[]) {
    if (!lines || lines.length === 0) {
      throw new BadRequestException('Journal entry must contain lines');
    }

    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const line of lines) {
      const debit = new Decimal(line.debit || 0);
      const credit = new Decimal(line.credit || 0);

      if (debit.isNegative() || credit.isNegative()) {
        throw new BadRequestException('Debit and credit amounts cannot be negative');
      }

      if (debit.greaterThan(0) && credit.greaterThan(0)) {
        throw new BadRequestException('A single journal line cannot have both debit and credit');
      }

      if (debit.isZero() && credit.isZero()) {
        throw new BadRequestException('A journal line must have either debit or credit');
      }

      totalDebit = totalDebit.plus(debit);
      totalCredit = totalCredit.plus(credit);
    }

    if (!totalDebit.equals(totalCredit)) {
      throw new BadRequestException(`Journal is unbalanced: Total Debit (${totalDebit.toFixed(4)}) != Total Credit (${totalCredit.toFixed(4)})`);
    }
  }
}
