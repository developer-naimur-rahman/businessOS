import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class PurchaseLineDto {
  @IsString()
  variantId: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;
}

export class CreatePurchaseDto {
  @IsString()
  supplierId: string;

  @IsString()
  warehouseId: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  purchaseDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineDto)
  lines: PurchaseLineDto[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalDiscount?: number;
}

export class UpdatePurchaseDto extends CreatePurchaseDto {}

export class AddPurchasePaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  paymentDate: string;
}
