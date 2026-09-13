import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Partial<UsersRepository>>;

  beforeEach(async () => {
    repository = {
      findByIdAndOrganization: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      assignRole: jest.fn(),
      removeRole: jest.fn(),
      getUserWithRoles: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
