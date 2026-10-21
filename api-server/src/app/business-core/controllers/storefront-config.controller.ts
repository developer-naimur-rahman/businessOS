import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { StorefrontConfigService } from '../services/storefront-config.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('public/storefront-config')
export class StorefrontConfigController {
  constructor(private readonly configService: StorefrontConfigService) {}

  @Get()
  async getConfig() {
    const org = await this.configService['prisma'].organization.findFirst();
    return this.configService.getConfig(org ? org.id : '1');
  }
}

@Controller('admin/storefront-config')
@UseGuards(JwtAuthGuard)
export class AdminStorefrontConfigController {
  constructor(private readonly configService: StorefrontConfigService) {}

  @Get()
  async getConfig(@CurrentUser() user: any) {
    return this.configService.getConfig(user.organizationId);
  }

  @Put()
  async updateConfig(
    @CurrentUser() user: any,
    @Body() data: any
  ) {
    return this.configService.updateConfig(user.organizationId, data);
  }
}
