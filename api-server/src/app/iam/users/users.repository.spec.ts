import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UsersRepository Security Tests', () => {
  let repository: UsersRepository;
  let prisma: jest.Mocked<Partial<PrismaService>>;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
  });

  describe('findByIdAndOrganization (Resource Isolation)', () => {
    it('should throw NotFoundException (404) if user belongs to another organization (Security Requirement)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', organizationId: 'org-B' });
      await expect(repository.findByIdAndOrganization('org-A', '1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException (404) if user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(repository.findByIdAndOrganization('org-A', '1')).rejects.toThrow(NotFoundException);
    });

    it('should return user if organizationId matches', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', organizationId: 'org-A' });
      const user = await repository.findByIdAndOrganization('org-A', '1');
      expect(user.id).toBe('1');
    });
  });
});
