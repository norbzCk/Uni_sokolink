import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ minLength: 2, maxLength: 160, example: 'Amina Hassan' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  @Matches(/^[\p{L}\p{M} .'-]+$/u)
  fullName!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ minLength: 1, maxLength: 128, format: 'password' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

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
