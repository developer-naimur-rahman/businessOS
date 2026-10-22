import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { LoyaltyService, LoyaltyRulesDto, AdjustPointsDto } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.interface';

@Controller('admin/loyalty')
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('rules')
  async getRules(@CurrentUser() user: AuthenticatedUser) {
    return this.loyaltyService.getRules(user.organizationId);
  }

  @Post('rules')
  async saveRules(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LoyaltyRulesDto,
  ) {
    return this.loyaltyService.saveRules(user.organizationId, dto);
  }

  @Get('customers')
  async getCustomerWallets(@CurrentUser() user: AuthenticatedUser) {
    return this.loyaltyService.getCustomerWallets(user.organizationId);
  }

  @Post('adjust')
  async adjustPoints(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AdjustPointsDto,
  ) {
    return this.loyaltyService.adjustPoints(user.organizationId, user.userId, dto);
  }

  @Post('redeem-quote')
  async getRedeemQuote(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { customerId: string; subtotalAmount: number },
  ) {
    return this.loyaltyService.getRedeemQuote(user.organizationId, body.customerId, body.subtotalAmount || 0);
  }
}
