import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AsyncLocalStorage } from 'async_hooks';
import { Prisma } from '@prisma/client';

export const PRISMA_TX_ALS = new AsyncLocalStorage<Prisma.TransactionClient>();

@Injectable()
export class PrismaClientManager {
  constructor(private readonly prisma: PrismaService) {}

  get client(): Prisma.TransactionClient | PrismaService {
    return PRISMA_TX_ALS.getStore() || this.prisma;
  }
}

export abstract class IUnitOfWork {
  abstract run<T>(work: () => Promise<T>): Promise<T>;
}

@Injectable()
export class UnitOfWork implements IUnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(work: () => Promise<T>): Promise<T> {
    const activeTx = PRISMA_TX_ALS.getStore();
    if (activeTx) {
      // Already in a transaction
      return work();
    }
    
    // Start a new transaction
    return this.prisma.$transaction(async (tx) => {
      return PRISMA_TX_ALS.run(tx, work);
    });
  }
}
