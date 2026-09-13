import { Module } from '@nestjs/common';
import { FinanceIntegrationRepository } from './finance-integration.repository';
import { FinanceIntegrationService } from './finance-integration.service';
import { FinanceIntegrationController } from './finance-integration.controller';
import { FinanceModule } from '../finance/finance.module';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule, FinanceModule],
  providers: [FinanceIntegrationRepository, FinanceIntegrationService],
  controllers: [FinanceIntegrationController],
  exports: [FinanceIntegrationService],
})
export class FinanceIntegrationModule {}
