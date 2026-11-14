import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  CurrentUser,
  Public,
  requireInternalToken,
  type ServiceUser,
} from '@sokolink/platform';
import { CreatePaymentDto, ValidatePaymentMethodDto } from './payment.dto';
import { PaymentService } from './payment.service';

@ApiTags('payment')
@Controller({ path: 'payment', version: '1' })
export class PaymentController {
  constructor(private readonly payment: PaymentService) {}

  @Public()
  @Get('methods')
  @ApiOperation({ summary: 'List payment methods that are currently enabled' })
  methods() {
    return this.payment.listPublicMethods();
  }

  @Public()
  @Post('internal/validate-method')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal payment-method validation for checkout' })
  async validateMethod(@Body() dto: ValidatePaymentMethodDto, @Req() request: Request) {
    requireInternalToken(request.header('x-internal-token'));
    const method = await this.payment.validateMethod(dto.code);
    return { code: method.code, name: method.name };
  }

  @Public()
  @Post('internal/payments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Internal payment record creation for a placed order' })
  create(@Body() dto: CreatePaymentDto, @Req() request: Request) {
    requireInternalToken(request.header('x-internal-token'));
    return this.payment.createPayment(dto);
  }

  @ApiBearerAuth()
  @Get('payments/:orderId')
  @ApiOperation({ summary: 'Read the authenticated buyer payment record for an order' })
  getPayment(
    @CurrentUser() user: ServiceUser,
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
  ) {
    return this.payment.getPayment(user, orderId);
  }
}
