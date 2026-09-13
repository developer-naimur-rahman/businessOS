import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceRepository } from './finance.repository';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FinanceService, FinanceRepository],
  exports: [FinanceService, FinanceRepository],
})
export class FinanceModule {}
