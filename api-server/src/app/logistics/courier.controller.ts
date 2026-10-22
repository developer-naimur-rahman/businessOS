import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CourierService, CourierConfigDto, BookParcelDto } from './courier.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.interface';

@Controller('admin/logistics')
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class CourierController {
  constructor(private readonly courierService: CourierService) {}

  @Get('config')
  async getConfig(@CurrentUser() user: AuthenticatedUser) {
    return this.courierService.getConfig(user.organizationId);
  }

  @Post('config')
  async saveConfig(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CourierConfigDto,
  ) {
    return this.courierService.saveConfig(user.organizationId, dto);
  }

  @Post('test-connection')
  async testConnection(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { provider: 'STEADFAST' | 'PATHAO' },
  ) {
    return this.courierService.testConnection(user.organizationId, body.provider);
  }

  @Get('unbooked-orders')
  async getUnbookedOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.courierService.getUnbookedOrders(user.organizationId);
  }

  @Post('book-parcel')
  async bookParcel(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BookParcelDto,
  ) {
    return this.courierService.bookParcel(user.organizationId, user.userId, dto);
  }

  @Post('bulk-book')
  async bulkBook(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { parcels: BookParcelDto[] },
  ) {
    return this.courierService.bulkBook(user.organizationId, user.userId, body.parcels || []);
  }

  @Get('consignments')
  async getConsignments(@CurrentUser() user: AuthenticatedUser) {
    return this.courierService.getConsignments(user.organizationId);
  }

  @Get('label/:consignmentId')
  async getThermalLabel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('consignmentId') consignmentId: string,
  ) {
    return this.courierService.getThermalLabel(user.organizationId, consignmentId);
  }
}
