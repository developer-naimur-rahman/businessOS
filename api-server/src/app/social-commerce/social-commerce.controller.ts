import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SocialCommerceService, IngestSocialLeadDto } from './social-commerce.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.interface';

@Controller('admin/social-commerce')
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class SocialCommerceController {
  constructor(private readonly socialService: SocialCommerceService) {}

  @Post('parse-message')
  async parseMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { rawCustomerText: string },
  ) {
    return this.socialService.parseMessage(user.organizationId, body.rawCustomerText);
  }

  @Post('ingest')
  async ingestLead(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: IngestSocialLeadDto,
  ) {
    return this.socialService.ingestLead(user.organizationId, user.userId, dto);
  }

  @Get('leads')
  async getLeads(@CurrentUser() user: AuthenticatedUser) {
    return this.socialService.getLeads(user.organizationId);
  }

  @Post('convert-to-order')
  async convertToOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.socialService.convertToOrder(user.organizationId, user.userId, body);
  }
}
