import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export const CUSTOMER_CATEGORIES = ['STUDENT', 'STAFF'] as const;

export class RegisterDto {
  @ApiProperty({ minLength: 2, maxLength: 160, example: 'Amina Hassan' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  @Matches(/^[\p{L}\p{M} .'-]+$/u, {
    message: 'fullName may contain letters, spaces, apostrophes, hyphens and periods',
  })
  fullName!: string;

  @ApiProperty({ format: 'email', maxLength: 254, example: 'amina@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ minLength: 9, maxLength: 32, example: '+255 712 345 678' })
  @IsString()
  @MinLength(9)
  @MaxLength(32)
  phone!: string;

  @ApiProperty({ enum: CUSTOMER_CATEGORIES, example: 'STUDENT' })
  @IsIn(CUSTOMER_CATEGORIES)
  customerCategory!: (typeof CUSTOMER_CATEGORIES)[number];

  @ApiProperty({ minLength: 2, maxLength: 160, example: 'IFM' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  institution!: string;

  @ApiPropertyOptional({
    minLength: 3,
    maxLength: 64,
    example: '2024/12345',
    description: 'Required for student accounts',
  })
  @ValidateIf((dto: RegisterDto) => dto.customerCategory === 'STUDENT')
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  studentRegistrationNumber?: string;

  @ApiProperty({ minLength: 12, maxLength: 128, format: 'password' })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ minLength: 12, maxLength: 128, format: 'password' })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  passwordConfirmation!: string;
}
