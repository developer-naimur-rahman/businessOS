import { Test, TestingModule } from '@nestjs/testing';
import { CustomersRepository } from './customers.repository';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('Business Core - Tenant Isolation (CustomersRepository)', () => {
  let repository: CustomersRepository;
  let prisma: jest.Mocked<Partial<PrismaService>>;

  beforeEach(async () => {
    prisma = {
      customer: {
        findUnique: jest.fn(),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<CustomersRepository>(CustomersRepository);
  });

  describe('findByIdAndOrganization', () => {
    it('should return the customer if it belongs to the requesting organization', async () => {
      const mockCustomer = { id: 'cust-1', organizationId: 'org-A' };
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(mockCustomer);

      const result = await repository.findByIdAndOrganization('org-A', 'cust-1');
      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException if the customer belongs to a different organization (Cross-tenant leak)', async () => {
      // The database returns a customer belonging to org-B
      const mockCustomer = { id: 'cust-1', organizationId: 'org-B' };
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(mockCustomer);

      // The requesting user belongs to org-A
      await expect(repository.findByIdAndOrganization('org-A', 'cust-1'))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw NotFoundException if the customer does not exist', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(repository.findByIdAndOrganization('org-A', 'cust-invalid'))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});
