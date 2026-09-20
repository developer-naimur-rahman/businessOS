import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedUser } from '../types/authenticated-user.interface';
import { OrganizationContext } from '../context/organization-context.interface';

@Injectable()
export class OrganizationContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      console.log('OrganizationContextGuard: User is not authenticated');
      throw new UnauthorizedException('Authentication required for organization context');
    }

    if (!user.organizationId) {
      console.log('OrganizationContextGuard: User lacks organizationId', user);
      throw new ForbiddenException('User lacks a trusted organization context');
    }

    const trustedOrganizationId = user.organizationId;

    // Reject overrides from client input
    const clientProvidedIds = [
      request.query?.organizationId,
      request.params?.organizationId,
    ].filter(Boolean) as string[];

    // Recursively extract all organizationIds from the body
    const extractOrgIdsFromBody = (obj: any): string[] => {
      let ids: string[] = [];
      if (!obj || typeof obj !== 'object') return ids;
      
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'organizationId' && typeof value === 'string') {
          ids.push(value);
        } else if (typeof value === 'object') {
          ids = ids.concat(extractOrgIdsFromBody(value));
        }
      }
      return ids;
    };

    clientProvidedIds.push(...extractOrgIdsFromBody(request.body));

    for (const providedId of clientProvidedIds) {
      if (providedId !== trustedOrganizationId) {
        console.log(`OrganizationContextGuard: Client provided id ${providedId} does not match trusted ${trustedOrganizationId}`);
        throw new ForbiddenException(
          'Client-provided organization context overrides are strictly forbidden',
        );
      }
    }

    // Attach trusted context to the request for downstream processing
    request.organizationContext = {
      organizationId: trustedOrganizationId,
      userId: user.userId,
    } as OrganizationContext;

    return true;
  }
}
