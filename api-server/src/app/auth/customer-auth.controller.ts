import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerLoginDto, CustomerRegisterDto } from './dto/customer-auth.dto';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';

@Controller('public/auth')
@UseGuards(RateLimitGuard)
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @Post('login')
  @RateLimit({ limit: 10, ttlSeconds: 60 })
  async login(@Body() body: CustomerLoginDto) {
    return this.customerAuthService.loginWithCredentials(body.email, body.password);
  }

  @Post('register')
  @RateLimit({ limit: 10, ttlSeconds: 60 })
  async register(@Body() body: CustomerRegisterDto) {
    return this.customerAuthService.register(body);
  }
}

