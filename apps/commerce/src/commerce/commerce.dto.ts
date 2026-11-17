import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const TANZANIA_PHONE = /^(?:\+?255|0)[67]\d{8}$/;
const ORDER_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

export class CheckoutItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [CheckoutItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];

  @ApiProperty({ enum: ['SELLER_DELIVERY', 'PICKUP'] })
  @IsIn(['SELLER_DELIVERY', 'PICKUP'])
  deliveryMethod!: 'SELLER_DELIVERY' | 'PICKUP';

  @ApiProperty({ example: 'Amina Hassan' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  contactName!: string;

  @ApiProperty({ example: '+255712345678' })
  @Matches(TANZANIA_PHONE, { message: 'Enter a Tanzanian phone number, for example +255712345678.' })
  contactPhone!: string;

  @ApiPropertyOptional({ example: 'Dar es Salaam' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  region?: string;

  @ApiPropertyOptional({ example: 'Kinondoni' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  district?: string;

  @ApiPropertyOptional({ example: 'Mikocheni B, near Mwenge' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  addressLine?: string;

  @ApiPropertyOptional({ example: 'Opposite the campus gate' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  landmark?: string;

  @ApiPropertyOptional({ example: 'Please call before delivery.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({ example: 'CASH_ON_DELIVERY' })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  paymentMethodCode!: string;

  @ApiProperty({ description: 'Client-generated idempotency key for this checkout attempt' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  idempotencyKey!: string;
}

export class SellerOrdersQuery {
  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: (typeof ORDER_STATUSES)[number];
}

export class UpdateSellerOrderStatusDto {
  @ApiProperty({ enum: ORDER_STATUSES })
  @IsIn(ORDER_STATUSES)
  status!: (typeof ORDER_STATUSES)[number];

  @ApiPropertyOptional({ example: 'Handed to the buyer at the campus pickup point.' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
