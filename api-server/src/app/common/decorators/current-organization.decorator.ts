import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentOrganization = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    // The organizationId must only come from the trusted request.user context
    // Never from req.body, req.query, or req.params
    return request.user?.organizationId;
  },
);
