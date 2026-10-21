import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SystemController],
})
export class SystemModule {}
