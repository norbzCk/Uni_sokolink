import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class SpecificationDto {
  @ApiProperty({ example: 'Material' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'Stainless steel' })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  value!: string;
}

const CONDITIONS = ['NEW', 'USED', 'REFURBISHED'] as const;

export class CreateProductDto {
  @ApiProperty({ example: 'Stainless steel cooking pot' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ example: 'Durable three-litre cooking pot suitable for family meals.' })
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  description!: string;

  @ApiPropertyOptional({ enum: CONDITIONS })
  @IsOptional()
  @IsIn(CONDITIONS)
  condition?: (typeof CONDITIONS)[number];

  @ApiPropertyOptional({ example: 'Sunrise' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string;

  @ApiPropertyOptional({ example: 'SP-3000' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  model?: string;

  @ApiPropertyOptional({ example: 'piece' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  unit?: string;

  @ApiProperty({ example: 35000, description: 'Unit price in Tanzanian shillings' })
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(1_000_000_000)
  priceTzs!: number;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  openingStock!: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ type: [SpecificationDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => SpecificationDto)
  specifications?: SpecificationDto[];

  @ApiPropertyOptional({ type: [String], description: 'JPEG, PNG or WebP data URLs' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @MaxLength(2_800_000, { each: true })
  images?: string[];
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ enum: CONDITIONS })
  @IsOptional()
  @IsIn(CONDITIONS)
  condition?: (typeof CONDITIONS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(1_000_000_000)
  priceTzs?: number;

  @ApiPropertyOptional({ type: [SpecificationDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => SpecificationDto)
  specifications?: SpecificationDto[];
}

export class ListProductsQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  sellerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ enum: ['recommended', 'newest', 'price_asc', 'price_desc'] })
  @IsOptional()
  @IsIn(['recommended', 'newest', 'price_asc', 'price_desc'])
  sort?: 'recommended' | 'newest' | 'price_asc' | 'price_desc';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(48)
  pageSize?: number;
}

export class SellerProductQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'] })
  @IsOptional()
  @IsIn(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'])
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
}

export class AddProductImageDto {
  @ApiProperty({ description: 'JPEG, PNG or WebP data URL up to 2 MB' })
  @IsString()
  @MinLength(30)
  @MaxLength(2_800_000)
  dataUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  alt?: string;
}

export class RejectProductDto {
  @ApiProperty({ example: 'Add a clearer product photo and correct the description.' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class AdminProductQuery {
  @ApiPropertyOptional({ enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'] })
  @IsOptional()
  @IsIn(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'])
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
}
