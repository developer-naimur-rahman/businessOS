import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaClientManager, UnitOfWork, IUnitOfWork } from './prisma-client.manager';

@Global()
@Module({
  providers: [
    PrismaService,
    PrismaClientManager,
    { provide: IUnitOfWork, useClass: UnitOfWork }
  ],
  exports: [PrismaService, PrismaClientManager, IUnitOfWork],
})
export class PrismaModule {}
