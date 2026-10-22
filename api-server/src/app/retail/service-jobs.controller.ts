import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ServiceJobsService, CreateServiceJobDto, UpdateJobStatusDto } from './service-jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('admin/service-jobs')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class ServiceJobsController {
  constructor(private readonly serviceJobsService: ServiceJobsService) {}

  @Post()
  @RequirePermissions('services.manage')
  async createJob(@Request() req: any, @Body() body: CreateServiceJobDto) {
    return this.serviceJobsService.createJob(req.user.organizationId, req.user.id || null, body);
  }

  @Get()
  @RequirePermissions('services.view')
  async getJobs(@Request() req: any, @Query('status') status?: string, @Query('search') search?: string) {
    return this.serviceJobsService.getJobs(req.user.organizationId, status, search);
  }

  @Patch(':id/status')
  @RequirePermissions('services.manage')
  async updateJobStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdateJobStatusDto
  ) {
    return this.serviceJobsService.updateJobStatus(req.user.organizationId, req.user.id || null, id, body);
  }
}
