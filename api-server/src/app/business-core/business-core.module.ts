import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { CustomersRepository } from './repositories/customers.repository';
import { SuppliersRepository } from './repositories/suppliers.repository';
import { ProductsRepository } from './repositories/products.repository';
import { CategoriesRepository } from './repositories/categories.repository';
import { UnitsRepository } from './repositories/units.repository';
import { CustomersService } from './services/customers.service';
import { SuppliersService } from './services/suppliers.service';
import { ProductsService } from './services/products.service';
import { CategoriesService } from './services/categories.service';
import { UnitsService } from './services/units.service';
import { CustomersController } from './controllers/customers.controller';
import { SuppliersController } from './controllers/suppliers.controller';
import { ProductsController } from './controllers/products.controller';
import { CategoriesController } from './controllers/categories.controller';
import { UnitsController } from './controllers/units.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    CustomersController,
    SuppliersController,
    ProductsController,
    CategoriesController,
    UnitsController,
  ],
  providers: [
    CustomersRepository,
    SuppliersRepository,
    ProductsRepository,
    CategoriesRepository,
    UnitsRepository,
    CustomersService,
    SuppliersService,
    ProductsService,
    CategoriesService,
    UnitsService,
  ],
  exports: [
    CustomersService,
    SuppliersService,
    ProductsService,
    CategoriesService,
    UnitsService,
  ],
})
export class BusinessCoreModule {}
