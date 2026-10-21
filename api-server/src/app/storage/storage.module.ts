import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
