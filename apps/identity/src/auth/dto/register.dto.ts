import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  @Matches(/^[\p{L}\p{M} .'-]+$/u, {
    message: 'fullName may contain letters, spaces, apostrophes, hyphens and periods',
  })
  fullName!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(9)
  @MaxLength(32)
  phone!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  passwordConfirmation!: string;
}
