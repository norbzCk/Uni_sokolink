import { IsEmail, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ format: 'email', maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ pattern: '^\\d{6}$', example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be a six digit number' })
  code!: string;
}

export class ResendEmailVerificationDto {
  @ApiProperty({ format: 'email', maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class VerifyPhoneDto {
  @ApiProperty({ pattern: '^\\d{6}$', example: '012345' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be a six digit number' })
  code!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ format: 'email', maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ minLength: 20, maxLength: 200 })
  @IsString()
  @MinLength(20)
  @MaxLength(200)
  token!: string;

  @ApiProperty({ minLength: 12, maxLength: 128, format: 'password' })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ minLength: 12, maxLength: 128, format: 'password' })
  @IsString()
  @Length(12, 128)
  passwordConfirmation!: string;
}
