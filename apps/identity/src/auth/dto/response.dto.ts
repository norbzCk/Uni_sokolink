import { ApiProperty } from '@nestjs/swagger';
import type { CustomerCategory, RoleName, UserStatus } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Amina Hassan' })
  fullName!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ example: '+255712345678' })
  phone!: string;

  @ApiProperty({ enum: ['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DISABLED'] })
  status!: UserStatus;

  @ApiProperty({ enum: ['UNKNOWN', 'STUDENT', 'STAFF'] })
  customerCategory!: CustomerCategory;

  @ApiProperty({ nullable: true })
  institution!: string | null;

  @ApiProperty({ nullable: true })
  studentRegistrationNumber!: string | null;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiProperty()
  phoneVerified!: boolean;

  @ApiProperty({ isArray: true, enum: ['CUSTOMER', 'SELLER', 'DELIVERY_PARTNER', 'ADMIN', 'SUPER_ADMIN'] })
  roles!: RoleName[];

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

export class UserEnvelopeResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Short lived bearer access token', format: 'jwt' })
  accessToken!: string;

  @ApiProperty({ description: 'Access token lifetime in seconds', example: 900 })
  expiresIn!: number;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}

export class RegistrationResponseDto {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ enum: ['PENDING_VERIFICATION'] })
  status!: string;

  @ApiProperty({ description: 'False if delivery is temporarily unavailable; account remains unverified' })
  verificationEmailSent!: boolean;

  @ApiProperty({ description: 'False if no SMS provider is configured or delivery failed' })
  phoneVerificationSent!: boolean;
}

export class SessionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', nullable: true })
  lastUsedAt!: string | null;

  @ApiProperty({ format: 'date-time' })
  expiresAt!: string;

  @ApiProperty({ nullable: true })
  userAgent!: string | null;

  @ApiProperty()
  current!: boolean;
}

export class SessionListResponseDto {
  @ApiProperty({ type: SessionResponseDto, isArray: true })
  sessions!: SessionResponseDto[];
}

export class MessageResponseDto {
  @ApiProperty()
  message!: string;
}
