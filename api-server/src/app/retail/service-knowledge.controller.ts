import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ServiceKnowledgeService } from './service-knowledge.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

// Public endpoints for customers & storefront visitors
@Controller('public/services')
export class PublicServicesController {
  constructor(private readonly knowledgeService: ServiceKnowledgeService) {}

  @Get()
  async getServices() {
    return this.knowledgeService.getServices();
  }

  @Get(':slug')
  async getServiceBySlug(@Param('slug') slug: string) {
    return this.knowledgeService.getServiceBySlugOrId(slug);
  }
}

// Admin management endpoints for service catalog, requirements & AI research
@Controller('admin/service-knowledge')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class AdminServiceKnowledgeController {
  constructor(private readonly knowledgeService: ServiceKnowledgeService) {}

  @Get()
  @RequirePermissions('services.view')
  async getAllServices(@Request() req: any) {
    return this.knowledgeService.getServices(req.user.organizationId);
  }

  @Get('research-queue')
  @RequirePermissions('services.view')
  async getResearchQueue(@Request() req: any) {
    return this.knowledgeService.getResearchQueue(req.user.organizationId);
  }

  @Post()
  @RequirePermissions('services.manage')
  async saveService(@Request() req: any, @Body() body: any) {
    return this.knowledgeService.saveService(req.user.organizationId, req.user.id || req.user.sub, body);
  }

  @Post('research/propose')
  @RequirePermissions('services.manage')
  async proposeAiResearch(@Request() req: any, @Body() body: any) {
    return this.knowledgeService.proposeAiResearch(req.user.organizationId, body);
  }

  @Post('research/:proposalId/review')
  @RequirePermissions('services.manage')
  async reviewResearch(
    @Request() req: any,
    @Param('proposalId') proposalId: string,
    @Body() body: { action: 'APPROVE' | 'REJECT'; overrides?: any }
  ) {
    return this.knowledgeService.reviewResearchProposal(
      req.user.organizationId,
      req.user.id || req.user.sub,
      proposalId,
      body.action,
      body.overrides
    );
  }
}
