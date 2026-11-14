import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class ValidatePaymentMethodDto {
  @ApiProperty({ example: 'CASH_ON_DELIVERY' })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  code!: string;
}

export class CreatePaymentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  orderId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  buyerId!: string;

  @ApiProperty({ example: 35000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2_000_000_000)
  amountTzs!: number;

  @ApiProperty({ example: 'CASH_ON_DELIVERY' })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  methodCode!: string;
}
