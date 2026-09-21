import { IsArray, IsEnum, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export enum BulkProductAction {
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',
  ARCHIVE = 'ARCHIVE',
  SET_ONLINE_VISIBLE = 'SET_ONLINE_VISIBLE',
  SET_ONLINE_HIDDEN = 'SET_ONLINE_HIDDEN',
  SET_POS_VISIBLE = 'SET_POS_VISIBLE',
  SET_POS_HIDDEN = 'SET_POS_HIDDEN',
}

export class BulkProductOperationDto {
  @IsArray()
  @IsString({ each: true })
  productIds: string[];

  @IsEnum(BulkProductAction)
  action: BulkProductAction;
}
