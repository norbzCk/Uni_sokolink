import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const TANZANIA_PHONE = /^(?:\+?255|0)[67]\d{8}$/;

export class SellerApplicationDto {
  @ApiProperty({ example: 'Amina Home Supplies' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  businessName!: string;

  @ApiProperty({ example: 'Home & Kitchen' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  businessCategory!: string;

  @ApiProperty({ example: 'Dar es Salaam' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  region!: string;

  @ApiProperty({ example: 'Kinondoni' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  district!: string;

  @ApiProperty({ example: '+255712345678' })
  @Matches(TANZANIA_PHONE, { message: 'Enter a Tanzanian phone number, for example +255712345678.' })
  phone!: string;

  @ApiProperty({ enum: ['IFM'], example: 'IFM' })
  @IsIn(['IFM'], {
    message: 'At launch, only IFM students can apply to sell on SokoLink.',
  })
  institution!: 'IFM';

  @ApiProperty({ minLength: 3, maxLength: 64, example: '2024/12345' })
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  studentRegistrationNumber!: string;

  @ApiProperty({ minLength: 3, maxLength: 160, example: 'IFM-STUDENT-ID-12345' })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  evidenceReference!: string;

  @ApiProperty({ example: 'We supply affordable kitchenware to students and families in Dar es Salaam.' })
  @IsString()
  @MinLength(20)
  @MaxLength(3000)
  description!: string;
}

export class RejectSellerApplicationDto {
  @ApiProperty({ example: 'Please provide a clearer business description and a reachable phone number.' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class SellerProfileDto {
  @ApiProperty({ example: 'Amina Home Supplies' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  businessName!: string;

  @ApiProperty({ example: 'Home & Kitchen' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  businessCategory!: string;

  @ApiProperty({ example: 'Dar es Salaam' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  region!: string;

  @ApiProperty({ example: 'Kinondoni' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  district!: string;

  @ApiProperty({ example: '+255712345678' })
  @Matches(TANZANIA_PHONE, { message: 'Enter a Tanzanian phone number, for example +255712345678.' })
  phone!: string;

  @ApiPropertyOptional({ format: 'email' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiProperty({ example: 'We supply affordable kitchenware to students and families in Dar es Salaam.' })
  @IsString()
  @MinLength(20)
  @MaxLength(3000)
  description!: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'PAUSED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'PAUSED'])
  status?: 'ACTIVE' | 'PAUSED';

  @ApiPropertyOptional({ description: 'JPEG, PNG or WebP data URL up to 1.5 MB' })
  @IsOptional()
  @IsString()
  @MaxLength(2_800_000)
  logoDataUrl?: string;
}
