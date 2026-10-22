import { Module } from '@nestjs/common';
import { SocialCommerceController } from './social-commerce.controller';
import { SocialCommerceService } from './social-commerce.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SocialCommerceController],
  providers: [SocialCommerceService],
  exports: [SocialCommerceService],
})
export class SocialCommerceModule {}
