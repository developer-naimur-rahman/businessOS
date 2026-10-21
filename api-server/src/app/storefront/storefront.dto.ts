import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsObject, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { Prisma } from '@prisma/client';

export class ServiceQuoteDto {
  @IsObject()
  @IsNotEmpty()
  configuration: Record<string, any>;

  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number = 1;
}

export class StorageUploadDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsNumber()
  @Min(1)
  sizeBytes: number;
}

export class ProductCheckoutDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
  
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @IsUUID()
  @IsNotEmpty()
  warehouseId: string;
}

export class ServiceCheckoutDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number = 1;
  
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @IsUUID()
  @IsNotEmpty()
  warehouseId: string;

  @IsObject()
  @IsNotEmpty()
  configuration: Record<string, any>;

  @IsString({ each: true })
  @IsOptional()
  storageObjectIds?: string[];
}
