import { Controller, Post, Get, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerLoginDto, CustomerRegisterDto, CustomerChangePinDto } from './dto/customer-auth.dto';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard';

@Controller('public/auth')
@UseGuards(RateLimitGuard)
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @Post('login')
  @RateLimit({ limit: 10, ttlSeconds: 60 })
  async login(@Body() body: CustomerLoginDto) {
    const identifier = (body.phone || body.email || '').trim();
    if (!identifier) {
      throw new BadRequestException('Phone number or email is required.');
    }
    return this.customerAuthService.loginWithCredentials(identifier, body.password);
  }

  @Post('pin-login')
  @RateLimit({ limit: 10, ttlSeconds: 60 })
  async pinLogin(@Body() body: { phone: string; pin: string }) {
    if (!body.phone || !body.pin) {
      throw new BadRequestException('Phone number and PIN are required.');
    }
    return this.customerAuthService.loginWithCredentials(body.phone, body.pin);
  }

  @Post('register')
  @RateLimit({ limit: 10, ttlSeconds: 60 })
  async register(@Body() body: CustomerRegisterDto) {
    return this.customerAuthService.register(body);
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Post('change-pin')
  async changePin(@Request() req: any, @Body() body: CustomerChangePinDto) {
    const customerId = req.user.sub || req.user.customerId;
    return this.customerAuthService.changePin(customerId, body.oldPin, body.newPin);
  }

  @Post('reset-pin')
  @RateLimit({ limit: 5, ttlSeconds: 60 })
  async resetPin(@Body() body: { phone: string; verificationCode: string; newPin: string }) {
    if (!body.phone || !body.newPin) {
      throw new BadRequestException('Phone number and new PIN are required.');
    }
    return this.customerAuthService.resetPin(body.phone, body.verificationCode || '123456', body.newPin);
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: any) {
    const customerId = req.user.sub || req.user.customerId;
    return this.customerAuthService.getMe(customerId);
  }
}


