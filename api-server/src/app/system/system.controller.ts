import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';

@Controller('system')
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class SystemController {
  @Get('context')
  getContext(@Req() request: any) {
    // Return only the trusted OrganizationContext attached by the guard
    return request.organizationContext;
  }
}
