import { Controller, Post, Body } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';

@Controller('public/auth')
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    return this.customerAuthService.loginWithCredentials(body.email, body.password);
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.customerAuthService.register(body);
  }
}
