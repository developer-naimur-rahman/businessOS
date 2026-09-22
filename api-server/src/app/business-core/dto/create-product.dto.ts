import { Type } from 'class-transformer';
import { 
  IsString, 
  IsOptional, 
  IsBoolean, 
  IsNumber, 
  IsArray, 
  ValidateNested, 
  IsEnum 
} from 'class-validator';
import { ProductType, ProductStatus, TrackingType } from '@prisma/client';

export class CreateVariantDto {
  @IsString()
  @IsOptional()
  sku?: string;

  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @IsNumber()
  @IsOptional()
  retailPrice?: number;

  @IsNumber()
  @IsOptional()
  posPrice?: number;

  @IsEnum(TrackingType)
  @IsOptional()
  trackingType?: TrackingType;
  
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsBoolean()
  @IsOptional()
  isOnlineVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  isPosVisible?: boolean;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsBoolean()
  @IsOptional()
  isOnlineVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  isPosVisible?: boolean;

  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @IsNumber()
  @IsOptional()
  sellingPrice?: number;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  unitId?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}
