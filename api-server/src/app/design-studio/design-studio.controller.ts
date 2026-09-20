import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import { DesignStudioService } from './design-studio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Response } from 'express';

@Controller('design-studio/designs')
@UseGuards(JwtAuthGuard)
export class DesignStudioController {
  constructor(private readonly designStudioService: DesignStudioService) {}

  @Get()
  async getDesigns(@CurrentUser() user: any) {
    return this.designStudioService.getDesigns(user.organizationId);
  }

  @Post()
  async createDesign(@CurrentUser() user: any, @Body() body: any) {
    return this.designStudioService.createDesign(user.organizationId, body);
  }

  @Put(':id')
  async updateDesign(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any
  ) {
    return this.designStudioService.updateDesign(user.organizationId, id, body);
  }

  @Delete(':id')
  async deleteDesign(@CurrentUser() user: any, @Param('id') id: string) {
    return this.designStudioService.deleteDesign(user.organizationId, id);
  }

  @Post(':id/duplicate')
  async duplicateDesign(@CurrentUser() user: any, @Param('id') id: string) {
    return this.designStudioService.duplicateDesign(user.organizationId, id);
  }

  @Get(':id/pdf')
  async generatePdf(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Res() res: Response
  ) {
    const pdfBuffer = await this.designStudioService.generatePdf(user.organizationId, id);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="banner-design-${id}.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    res.end(pdfBuffer);
  }
}
