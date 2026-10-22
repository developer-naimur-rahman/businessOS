import { Module } from '@nestjs/common';
import { OrderBotController } from './order-bot.controller';
import { OrderBotService } from './order-bot.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrderBotController],
  providers: [OrderBotService],
  exports: [OrderBotService],
})
export class AutomationModule {}
