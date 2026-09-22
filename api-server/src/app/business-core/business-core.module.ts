import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { CustomersRepository } from './repositories/customers.repository';
import { SuppliersRepository } from './repositories/suppliers.repository';
import { ProductsRepository } from './repositories/products.repository';
import { CategoriesRepository } from './repositories/categories.repository';
import { UnitsRepository } from './repositories/units.repository';
import { VariantsRepository } from './repositories/variants.repository';
import { AttributesRepository } from './repositories/attributes.repository';
import { BarcodesRepository } from './repositories/barcodes.repository';
import { MediaRepository } from './repositories/media.repository';
import { CustomersService } from './services/customers.service';
import { SuppliersService } from './services/suppliers.service';
import { ProductsService } from './services/products.service';
import { CategoriesService } from './services/categories.service';
import { UnitsService } from './services/units.service';
import { VariantsService } from './services/variants.service';
import { AttributesService } from './services/attributes.service';
import { BarcodesService } from './services/barcodes.service';
import { MediaService } from './services/media.service';
import { CustomersController } from './controllers/customers.controller';
import { SuppliersController } from './controllers/suppliers.controller';
import { ProductsController } from './controllers/products.controller';
import { CategoriesController } from './controllers/categories.controller';
import { UnitsController } from './controllers/units.controller';
import { VariantsController } from './controllers/variants.controller';
import { AttributesController } from './controllers/attributes.controller';
import { BarcodesController } from './controllers/barcodes.controller';
import { MediaController } from './controllers/media.controller';
import { PublicCatalogController } from './controllers/public-catalog.controller';
import { PriceListController } from './controllers/price-list.controller';
import { PriceListService } from './services/price-list.service';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsController } from './controllers/analytics.controller';
import { StorefrontConfigService } from './services/storefront-config.service';
import { StorefrontConfigController, AdminStorefrontConfigController } from './controllers/storefront-config.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    CustomersController,
    SuppliersController,
    ProductsController,
    CategoriesController,
    UnitsController,
    VariantsController,
    AttributesController,
    BarcodesController,
    MediaController,
    PublicCatalogController,
    PriceListController,
    AnalyticsController,
    StorefrontConfigController,
    AdminStorefrontConfigController,
  ],
  providers: [
    CustomersRepository,
    SuppliersRepository,
    ProductsRepository,
    CategoriesRepository,
    UnitsRepository,
    VariantsRepository,
    AttributesRepository,
    BarcodesRepository,
    MediaRepository,
    CustomersService,
    SuppliersService,
    ProductsService,
    CategoriesService,
    UnitsService,
    VariantsService,
    AttributesService,
    BarcodesService,
    MediaService,
    PriceListService,
    AnalyticsService,
    StorefrontConfigService,
  ],
  exports: [
    CustomersService,
    CustomersRepository,
    SuppliersService,
    SuppliersRepository,
    ProductsService,
    ProductsRepository,
    CategoriesService,
    UnitsService,
    VariantsService,
    AttributesService,
    BarcodesService,
    MediaService,
    AnalyticsService,
    StorefrontConfigService,
  ],
})
export class BusinessCoreModule {}
