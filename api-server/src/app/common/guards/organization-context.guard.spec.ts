import { OrganizationContextGuard } from './organization-context.guard';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedUser } from '../types/authenticated-user.interface';

describe('OrganizationContextGuard', () => {
  let guard: OrganizationContextGuard;
  let mockContext: Partial<ExecutionContext>;
  let mockRequest: any;

  beforeEach(() => {
    guard = new OrganizationContextGuard();
    mockRequest = {
      body: {},
      query: {},
      params: {},
    };
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => ({} as any),
        getNext: () => ({} as any),
      }),
    };
  });

  it('should throw UnauthorizedException if no user present', () => {
    expect(() => guard.canActivate(mockContext as ExecutionContext)).toThrow(UnauthorizedException);
  });

  it('should throw ForbiddenException if user has no organizationId', () => {
    mockRequest.user = { userId: '1' } as AuthenticatedUser;
    expect(() => guard.canActivate(mockContext as ExecutionContext)).toThrow(ForbiddenException);
  });

  it('should attach organizationContext if valid', () => {
    mockRequest.user = { userId: '1', organizationId: 'ORG-A' } as AuthenticatedUser;
    const result = guard.canActivate(mockContext as ExecutionContext);
    expect(result).toBe(true);
    expect(mockRequest.organizationContext).toEqual({
      organizationId: 'ORG-A',
      userId: '1',
    });
  });

  it('should reject if body contains overriding organizationId', () => {
    mockRequest.user = { userId: '1', organizationId: 'ORG-A' } as AuthenticatedUser;
    mockRequest.body = { organizationId: 'ORG-B' };
    expect(() => guard.canActivate(mockContext as ExecutionContext)).toThrow(ForbiddenException);
  });

  it('should reject if query contains overriding organizationId', () => {
    mockRequest.user = { userId: '1', organizationId: 'ORG-A' } as AuthenticatedUser;
    mockRequest.query = { organizationId: 'ORG-B' };
    expect(() => guard.canActivate(mockContext as ExecutionContext)).toThrow(ForbiddenException);
  });

  it('should reject if nested body contains overriding organizationId', () => {
    mockRequest.user = { userId: '1', organizationId: 'ORG-A' } as AuthenticatedUser;
    mockRequest.body = { project: { organizationId: 'ORG-B' } };
    expect(() => guard.canActivate(mockContext as ExecutionContext)).toThrow(ForbiddenException);
  });

  it('should allow if client provides same organizationId as trusted context', () => {
    mockRequest.user = { userId: '1', organizationId: 'ORG-A' } as AuthenticatedUser;
    mockRequest.body = { organizationId: 'ORG-A' };
    const result = guard.canActivate(mockContext as ExecutionContext);
    expect(result).toBe(true);
  });
});
