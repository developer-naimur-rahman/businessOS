import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../iam/users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<Partial<UsersService>>;

  beforeEach(async () => {
    usersService = {
      findById: jest.fn(),
      getEffectivePermissions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should ignore client-provided roleIds and permissions from payload and fetch from database', async () => {
    const maliciousPayload = {
      sub: 'user-1',
      roleIds: ['ADMIN-ROLE'],
      permissions: ['finance.journal.post'],
    };

    usersService.findById.mockResolvedValue({
      id: 'user-1',
      organizationId: 'ORG-A',
      isActive: true,
    } as any);

    // Database actually returns NO permissions
    usersService.getEffectivePermissions.mockResolvedValue({
      roleIds: [],
      permissions: [],
    });

    const result = await strategy.validate(maliciousPayload);

    // The resulting context must match the database, not the malicious payload
    expect(result.userId).toBe('user-1');
    expect(result.organizationId).toBe('ORG-A');
    expect(result.roleIds).toEqual([]);
    expect(result.permissions).toEqual([]);
  });

  it('should throw UnauthorizedException if user is deactivated or deleted', async () => {
    usersService.findById.mockResolvedValue({ id: 'user-1', isActive: false } as any);
    await expect(strategy.validate({ sub: 'user-1' })).rejects.toThrow(UnauthorizedException);
  });
});
