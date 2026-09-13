import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../iam/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';

jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
    };
    jwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.validateUser('test@test.com', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      usersService.findByEmail.mockResolvedValue({ id: '1', password: 'hash' } as any);
      (argon2.verify as jest.Mock).mockResolvedValue(false);
      await expect(service.validateUser('test@test.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });

    it('should return user without password if valid', async () => {
      usersService.findByEmail.mockResolvedValue({ id: '1', password: 'hash', email: 'test@test.com' } as any);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      const result = await service.validateUser('test@test.com', 'correct');
      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe('1');
    });
  });
});
