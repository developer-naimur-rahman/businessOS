import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { OrderBotService, SendConfirmationDto, WebhookReplyDto } from './order-bot.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.interface';

@Controller('admin/automation/order-bot')
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class OrderBotController {
  constructor(private readonly botService: OrderBotService) {}

  @Get('queue')
  async getQueue(@CurrentUser() user: AuthenticatedUser) {
    return this.botService.getConfirmationQueue(user.organizationId);
  }

  @Post('send-confirmation')
  async sendConfirmation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendConfirmationDto,
  ) {
    return this.botService.sendConfirmation(user.organizationId, user.userId, dto);
  }

  @Post('webhook-reply')
  async processReply(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: WebhookReplyDto,
  ) {
    return this.botService.processWebhookReply(user.organizationId, user.userId, dto);
  }

  @Get('risk-check/:phone')
  async checkRisk(
    @CurrentUser() user: AuthenticatedUser,
    @Param('phone') phone: string,
  ) {
    return this.botService.checkCustomerRisk(user.organizationId, phone);
  }
}
