import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class StockItemInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  quantity!: number;
}

export class InitializeStockDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sellerId!: string;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  quantity!: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000)
  lowStockThreshold!: number;

  @ApiProperty({ example: 'piece' })
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  unit!: string;
}

export class StockLevelsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID(undefined, { each: true })
  productIds!: string[];
}

export class StockMovementBatchDto {
  @ApiProperty({ type: [StockItemInputDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => StockItemInputDto)
  items!: StockItemInputDto[];

  @ApiProperty({ example: 'ORD-2026-0001' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  reference!: string;
}

export class AdjustStockDto {
  @ApiProperty({ example: 10, description: 'Signed change to on-hand stock' })
  @Type(() => Number)
  @IsInt()
  @Min(-1_000_000)
  @Max(1_000_000)
  quantityDelta!: number;

  @ApiProperty({ example: 'Stock count correction after physical audit' })
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  reason!: string;
}

export class InventoryAnalyticsQueryDto {
  @ApiPropertyOptional({ enum: [7, 30, 90], default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([7, 30, 90])
  days?: number;
}

export class StockSettingsDto {
  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ example: 'piece' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  unit?: string;
}

export class SalesCommitDto {
  @ApiProperty({ type: [StockItemInputDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => StockItemInputDto)
  items!: StockItemInputDto[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  reference!: string;
}
