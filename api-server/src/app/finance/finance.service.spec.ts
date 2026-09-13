import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService, CreateJournalEntryDto } from './finance.service';
import { FinanceRepository } from './finance.repository';
import { BadRequestException } from '@nestjs/common';
import { EntryStatus, PeriodStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('Financial Invariants Test Foundation', () => {
  let service: FinanceService;
  let repository: jest.Mocked<Partial<FinanceRepository>>;

  beforeEach(async () => {
    repository = {
      createJournalEntry: jest.fn().mockResolvedValue({ id: 'j-1', status: EntryStatus.DRAFT }),
      findFiscalPeriodByIdAndOrganization: jest.fn(),
      getAccountByIdAndOrganization: jest.fn(),
      findJournalEntryByIdAndOrganization: jest.fn(),
      postJournalEntry: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: FinanceRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
  });

  const getValidLines = () => [
    { accountId: 'a1', debit: 100, credit: 0 },
    { accountId: 'a2', debit: 0, credit: 100 },
  ];

  const getValidDto = (): CreateJournalEntryDto => ({
    accountingDate: new Date(),
    lines: getValidLines(),
  });

  describe('Journal Balance (SUM(debit) = SUM(credit))', () => {
    it('should allow DRAFT when debits equal credits', async () => {
      (repository.getAccountByIdAndOrganization as jest.Mock).mockResolvedValue({});
      
      const dto = getValidDto();
      const result = await service.createDraftJournalEntry('org-1', 'user-1', dto);
      
      expect(result).toBeDefined();
      expect(repository.createJournalEntry).toHaveBeenCalled();
    });

    it('should throw BadRequestException when debits do not equal credits', async () => {
      const dto = getValidDto();
      dto.lines[1].credit = 90; // Unbalance it

      await expect(service.createDraftJournalEntry('org-1', 'user-1', dto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('Debit/Credit Exclusivity', () => {
    it('should be invalid if debit > 0 AND credit > 0', async () => {
      const dto = getValidDto();
      dto.lines[0].credit = 50; // Add credit to a debit line

      await expect(service.createDraftJournalEntry('org-1', 'user-1', dto))
        .rejects.toThrow(BadRequestException);
    });

    it('should be invalid if debit = 0 AND credit = 0', async () => {
      const dto = getValidDto();
      dto.lines.push({ accountId: 'a3', debit: 0, credit: 0 });

      await expect(service.createDraftJournalEntry('org-1', 'user-1', dto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('Fiscal Period Locking', () => {
    it('should fail when POSTING into a CLOSED or LOCKED fiscal period', async () => {
      const dto = getValidDto();
      dto.fiscalPeriodId = 'fp-1';
      
      (repository.findFiscalPeriodByIdAndOrganization as jest.Mock).mockResolvedValue({ status: PeriodStatus.CLOSED });

      await expect(service.createDraftJournalEntry('org-1', 'user-1', dto))
        .rejects.toThrow(BadRequestException);
    });

    it('should succeed when POSTING into an OPEN fiscal period', async () => {
      const dto = getValidDto();
      dto.fiscalPeriodId = 'fp-1';
      
      (repository.findFiscalPeriodByIdAndOrganization as jest.Mock).mockResolvedValue({ status: PeriodStatus.OPEN });
      (repository.getAccountByIdAndOrganization as jest.Mock).mockResolvedValue({});

      await expect(service.createDraftJournalEntry('org-1', 'user-1', dto)).resolves.toBeDefined();
    });
  });

  describe('Posted Journal Protection', () => {
    it('should prohibit posting a journal that is already POSTED', async () => {
      (repository.findJournalEntryByIdAndOrganization as jest.Mock).mockResolvedValue({
        id: 'j-1',
        status: EntryStatus.POSTED,
        lines: getValidLines(),
      });

      await expect(service.postJournalEntry('org-1', 'j-1', 'user-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should prohibit posting a journal that is REVERSED', async () => {
      (repository.findJournalEntryByIdAndOrganization as jest.Mock).mockResolvedValue({
        id: 'j-1',
        status: EntryStatus.REVERSED,
        lines: getValidLines(),
      });

      await expect(service.postJournalEntry('org-1', 'j-1', 'user-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('Dimensions', () => {
    it('should successfully pass dimensions down to creation', async () => {
      (repository.getAccountByIdAndOrganization as jest.Mock).mockResolvedValue({});
      
      const dto = getValidDto();
      dto.lines[0].businessUnitId = 'bu-1';
      dto.lines[0].branchId = 'br-1';
      dto.lines[0].departmentId = 'dp-1';
      dto.lines[0].projectId = 'pj-1';

      await service.createDraftJournalEntry('org-1', 'user-1', dto);
      
      expect(repository.createJournalEntry).toHaveBeenCalledWith(
        'org-1', 
        expect.objectContaining({
          lines: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({
                businessUnit: { connect: { id: 'bu-1' } },
                branch: { connect: { id: 'br-1' } },
                department: { connect: { id: 'dp-1' } },
                project: { connect: { id: 'pj-1' } },
              })
            ])
          })
        })
      );
    });
  });
});
