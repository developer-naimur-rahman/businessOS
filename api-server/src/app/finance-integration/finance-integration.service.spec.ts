import { Test, TestingModule } from '@nestjs/testing';
import { FinanceIntegrationService } from './finance-integration.service';
import { FinanceIntegrationRepository } from './finance-integration.repository';
import { FinanceService } from '../finance/finance.service';
import { PrismaClientManager, IUnitOfWork } from '../common/prisma/prisma-client.manager';
import { PrismaService } from '../common/prisma/prisma.service';
import { PaymentMethod, ProductType } from '@prisma/client';

describe('FinanceIntegrationService', () => {
  let service: FinanceIntegrationService;

  const mockRepo = {
    claimNextPendingEvent: jest.fn(),
    getConfig: jest.fn(),
    markEventCompleted: jest.fn(),
    markEventFailed: jest.fn(),
  };

  const mockFinanceService = {
    createDraftJournalEntry: jest.fn(),
    postJournalEntry: jest.fn(),
  };

  const mockPrismaClient = {
    sale: {
      findUnique: jest.fn(),
    },
  };

  const mockPrismaManager = {
    client: mockPrismaClient,
    run: jest.fn(async (cb) => cb()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceIntegrationService,
        { provide: FinanceIntegrationRepository, useValue: mockRepo },
        { provide: FinanceService, useValue: mockFinanceService },
        { provide: PrismaClientManager, useValue: mockPrismaManager },
        { provide: IUnitOfWork, useValue: mockPrismaManager }, // Reuse mockPrismaManager for runInTransaction -> run
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<FinanceIntegrationService>(FinanceIntegrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Basic mock test for full cash sale
  it('should process a full cash sale correctly', async () => {
    const event = {
      id: 'event-1',
      organizationId: 'org-1',
      eventType: 'SALE_COMPLETED',
      aggregateType: 'Sale',
      payload: { saleId: 'sale-1' }
    };

    mockRepo.claimNextPendingEvent
      .mockResolvedValueOnce(event)
      .mockResolvedValueOnce(null);

    mockRepo.getConfig.mockResolvedValue({
      cashAccountId: 'acc-cash',
      salesRevenueAccountId: 'acc-rev',
    });

    mockPrismaClient.sale.findUnique.mockResolvedValue({
      id: 'sale-1',
      total: '1000',
      discount: '0',
      branchId: 'branch-1',
      saleDate: new Date(),
      createdByUserId: 'user-1',
      payments: [
        { amount: '1000', method: PaymentMethod.CASH }
      ],
      lines: [
        { lineTotal: '1000', variant: { product: { type: ProductType.PRODUCT } } }
      ]
    });

    mockFinanceService.createDraftJournalEntry.mockResolvedValue({ id: 'journal-1' });

    await service.processPendingOutboxEvents('org-1');

    expect(mockFinanceService.createDraftJournalEntry).toHaveBeenCalledWith(
      'org-1', 'user-1', expect.objectContaining({
        idempotencyKey: 'event-1',
        lines: [
          { accountId: 'acc-cash', debit: expect.anything(), branchId: 'branch-1' },
          { accountId: 'acc-rev', credit: expect.anything(), branchId: 'branch-1' }
        ]
      })
    );
    expect(mockFinanceService.postJournalEntry).toHaveBeenCalled();
    expect(mockRepo.markEventCompleted).toHaveBeenCalledWith('event-1');
  });
});
