import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { PriceListService } from '../services/price-list.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Response } from 'express';

@Controller('business-core/price-list')
@UseGuards(JwtAuthGuard)
export class PriceListController {
  constructor(private readonly priceListService: PriceListService) {}

  @Get('pdf')
  async generatePdf(
    @CurrentUser() user: any,
    @Query() query: any,
    @Res() res: Response
  ) {
    const pdfBuffer = await this.priceListService.generatePdf(user.organizationId, query);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="price-list.pdf"',
      'Content-Length': pdfBuffer.length
    });

    res.end(pdfBuffer);
  }
}
