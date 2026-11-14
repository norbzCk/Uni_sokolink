import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequireRoles, type ServiceUser } from '@sokolink/platform';
import {
  CreateOrderDto,
  SellerOrdersQuery,
  UpdateSellerOrderStatusDto,
} from './commerce.dto';
import { CommerceService } from './commerce.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller({ path: 'orders', version: '1' })
export class CommerceController {
  constructor(private readonly commerce: CommerceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Place a checkout order with one or more sellers' })
  create(@CurrentUser() user: ServiceUser, @Body() dto: CreateOrderDto) {
    return this.commerce.createOrder(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List orders placed by the authenticated buyer' })
  listMine(@CurrentUser() user: ServiceUser) {
    return this.commerce.listBuyerOrders(user);
  }

  @RequireRoles('SELLER')
  @Get('seller')
  @ApiOperation({ summary: 'List seller suborders for the authenticated seller' })
  listSeller(@CurrentUser() user: ServiceUser, @Query() query: SellerOrdersQuery) {
    return this.commerce.listSellerOrders(user, query);
  }

  @RequireRoles('SELLER')
  @Get('seller/stats')
  @ApiOperation({ summary: 'Seller order counts and completed sales' })
  sellerStats(@CurrentUser() user: ServiceUser) {
    return this.commerce.sellerStats(user);
  }

  @RequireRoles('SELLER')
  @Get('seller/:id')
  @ApiOperation({ summary: 'Read a seller suborder owned by the authenticated seller' })
  sellerOrder(
    @CurrentUser() user: ServiceUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.commerce.getSellerOrder(user, id);
  }

  @RequireRoles('SELLER')
  @Patch('seller/:id/status')
  @ApiOperation({ summary: 'Advance or cancel a seller suborder' })
  updateStatus(
    @CurrentUser() user: ServiceUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSellerOrderStatusDto,
  ) {
    return this.commerce.updateSellerOrderStatus(user, id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Read an order placed by the authenticated buyer' })
  getMine(
    @CurrentUser() user: ServiceUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.commerce.getBuyerOrder(user, id);
  }
}
