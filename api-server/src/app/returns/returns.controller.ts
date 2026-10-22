import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ReturnsService, CreateRmaDto, ProcessQcDto } from './returns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.interface';

@Controller('admin/returns')
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  async getRmaList(@CurrentUser() user: AuthenticatedUser) {
    return this.returnsService.getRmaList(user.organizationId);
  }

  @Post()
  async createRma(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRmaDto,
  ) {
    return this.returnsService.createRma(user.organizationId, user.userId, dto);
  }

  @Patch(':id/process-qc')
  async processQc(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') rmaNumber: string,
    @Body() dto: ProcessQcDto,
  ) {
    return this.returnsService.processQc(user.organizationId, user.userId, rmaNumber, dto);
  }
}
