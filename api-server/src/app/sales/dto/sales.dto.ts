import { 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsArray, 
  ValidateNested, 
  IsNumber, 
  Min, 
  IsEnum, 
  IsIn 
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, ServiceFulfillmentStatus } from '@prisma/client';

export class OrderItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsNumber()
  @Min(0.01, { message: 'Quantity must be at least 0.01' })
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class CreateCustomerCheckoutDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  lines?: OrderItemDto[];

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentAmount?: number;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  customerNotes?: string;

  @IsOptional()
  @IsString()
  paymentProvider?: string;

  @IsOptional()
  @IsString()
  senderPhone?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsNumber()
  deliveryCharge?: number;

  @IsOptional()
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
}


export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsIn(['DRAFT', 'COMPLETED', 'CANCELLED'], { message: 'Status must be DRAFT, COMPLETED, or CANCELLED' })
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED';

  @IsOptional()
  @IsEnum(ServiceFulfillmentStatus)
  fulfillmentStatus?: ServiceFulfillmentStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  courier?: string;

  @IsOptional()
  @IsString()
  trackingCode?: string;
}

export class QuerySalesDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class TrackOrderDto {
  @IsNotEmpty({ message: 'Order ID or Sale Number is required' })
  @IsString()
  identifier: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
