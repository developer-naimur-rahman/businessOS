import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CampaignsService, GenerateCopyDto, LaunchCampaignDto } from './campaigns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.interface';

@Controller('admin/marketing')
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get('segments')
  async getSegments(@CurrentUser() user: AuthenticatedUser) {
    return this.campaignsService.getSegments(user.organizationId);
  }

  @Post('campaigns/generate-copy')
  async generateCopy(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GenerateCopyDto,
  ) {
    return this.campaignsService.generateCopy(user.organizationId, dto);
  }

  @Post('campaigns/launch')
  async launchCampaign(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LaunchCampaignDto,
  ) {
    return this.campaignsService.launchCampaign(user.organizationId, user.userId, dto);
  }

  @Get('campaigns')
  async getCampaigns(@CurrentUser() user: AuthenticatedUser) {
    return this.campaignsService.getCampaigns(user.organizationId);
  }
}
