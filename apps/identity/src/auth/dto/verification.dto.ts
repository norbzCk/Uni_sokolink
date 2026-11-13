import { IsEmail, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @MinLength(20)
  @MaxLength(200)
  token!: string;
}

export class ResendEmailVerificationDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class VerifyPhoneDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be a six digit number' })
  code!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(20)
  @MaxLength(200)
  token!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @IsString()
  @Length(12, 128)
  passwordConfirmation!: string;
}
