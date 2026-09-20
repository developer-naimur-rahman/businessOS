import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceRepository } from './finance.repository';
import { FinanceController } from './finance.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FinanceController],
  providers: [FinanceService, FinanceRepository],
  exports: [FinanceService, FinanceRepository],
})
export class FinanceModule {}
