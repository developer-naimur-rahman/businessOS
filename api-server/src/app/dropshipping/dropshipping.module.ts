import { Module } from '@nestjs/common';
import { DropshippingController } from './dropshipping.controller';
import { DropshippingService } from './dropshipping.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DropshippingController],
  providers: [DropshippingService],
  exports: [DropshippingService],
})
export class DropshippingModule {}
