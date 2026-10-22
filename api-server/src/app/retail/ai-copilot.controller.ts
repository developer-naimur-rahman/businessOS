import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AiCopilotService, AskCopilotDto } from './ai-copilot.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('admin/ai-copilot')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class AiCopilotController {
  constructor(private readonly aiCopilotService: AiCopilotService) {}

  @Post('ask')
  @RequirePermissions('analytics.view')
  async askCopilot(@Request() req: any, @Body() body: AskCopilotDto) {
    return this.aiCopilotService.askCopilot(req.user.organizationId, body);
  }
}
