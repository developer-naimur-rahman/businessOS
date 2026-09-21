import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { CustomersRepository } from '../repositories/customers.repository';

describe('CustomersService - Phase 6 Tests', () => {
  let service: CustomersService;
  let repo: jest.Mocked<CustomersRepository>;

  beforeEach(async () => {
    repo = {
      findByIdAndOrganization: jest.fn(),
      getLedger: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: CustomersRepository, useValue: repo },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  describe('getLedger', () => {
    it('should correctly calculate outstanding balance and sorting', async () => {
      repo.findByIdAndOrganization.mockResolvedValue({ id: 'c-1' } as any);
      
      const mockSales = [
        { id: 's-1', saleNumber: 'S1', saleDate: new Date('2026-09-10T10:00:00Z'), total: 5000 },
        { id: 's-2', saleNumber: 'S2', saleDate: new Date('2026-09-12T10:00:00Z'), total: 2000 },
      ];
      
      const mockPayments = [
        { id: 'p-1', saleId: 's-1', paymentDate: new Date('2026-09-11T10:00:00Z'), amount: 4000, method: 'CASH' },
        { id: 'p-2', saleId: 's-2', paymentDate: new Date('2026-09-13T10:00:00Z'), amount: 2000, method: 'BANK' },
      ];

      repo.getLedger.mockResolvedValue({ sales: mockSales, payments: mockPayments } as any);

      const result = await service.getLedger('org-1', 'c-1');
      
      expect(result.summary.totalSales).toBe(7000);
      expect(result.summary.totalPaid).toBe(6000);
      expect(result.summary.outstanding).toBe(1000);

      // Verify chronological sorting (oldest first for calculation, reversed for output)
      // Original chron: S1, P1, S2, P2. Reversed output: P2, S2, P1, S1
      expect(result.entries[0].type).toBe('PAYMENT'); // p-2
      expect(result.entries[0].paymentId).toBe('p-2');
      expect(result.entries[0].runningBalance).toBe(1000); // 5k - 4k + 2k - 2k
      
      expect(result.entries[3].type).toBe('SALE'); // s-1
      expect(result.entries[3].saleId).toBe('s-1');
      expect(result.entries[3].runningBalance).toBe(5000); 
    });

    it('should never return negative outstanding balance', async () => {
      repo.findByIdAndOrganization.mockResolvedValue({ id: 'c-1' } as any);
      // Simulating a data anomaly or overpayment edge case
      repo.getLedger.mockResolvedValue({
        sales: [{ id: 's-1', saleDate: new Date(), total: 1000 }],
        payments: [{ id: 'p-1', saleId: 's-1', paymentDate: new Date(), amount: 1500 }]
      } as any);

      const result = await service.getLedger('org-1', 'c-1');
      expect(result.summary.outstanding).toBe(0); // Cannot be -500
    });
  });
});
