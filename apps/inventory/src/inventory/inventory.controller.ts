import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  CurrentUser,
  Public,
  RequireRoles,
  requireInternalToken,
  type ServiceUser,
} from '@sokolink/platform';
import {
  AdjustStockDto,
  InitializeStockDto,
  InventoryAnalyticsQueryDto,
  StockLevelsDto,
  StockMovementBatchDto,
  StockSettingsDto,
} from './inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@Controller({ path: 'inventory', version: '1' })
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Public()
  @Post('internal/initialize')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Internal stock initialisation for a new product' })
  initialize(@Body() dto: InitializeStockDto, @Req() request: Request) {
    requireInternalToken(request.header('x-internal-token'));
    return this.inventory.initialize(dto);
  }

  @Public()
  @Post('internal/levels')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal batch stock level lookup' })
  async levels(@Body() dto: StockLevelsDto, @Req() request: Request) {
    requireInternalToken(request.header('x-internal-token'));
    return { items: await this.inventory.levels(dto.productIds) };
  }

  @Public()
  @Post('internal/reserve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reserve stock for checkout' })
  async reserve(@Body() dto: StockMovementBatchDto, @Req() request: Request) {
    requireInternalToken(request.header('x-internal-token'));
    return { items: await this.inventory.reserve(dto) };
  }

  @Public()
  @Post('internal/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release a stock reservation' })
  async release(@Body() dto: StockMovementBatchDto, @Req() request: Request) {
    requireInternalToken(request.header('x-internal-token'));
    return { items: await this.inventory.release(dto) };
  }

  @Public()
  @Post('internal/commit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Commit reserved stock after fulfilment' })
  async commit(@Body() dto: StockMovementBatchDto, @Req() request: Request) {
    requireInternalToken(request.header('x-internal-token'));
    return { items: await this.inventory.commitSale(dto) };
  }

  @ApiBearerAuth()
  @RequireRoles('SELLER')
  @Get('seller/analytics')
  @ApiOperation({ summary: 'Read inventory health and movement analytics for the seller dashboard' })
  analytics(@CurrentUser() user: ServiceUser, @Query() query: InventoryAnalyticsQueryDto) {
    return this.inventory.analytics(user.id, query.days ?? 30);
  }

  @ApiBearerAuth()
  @RequireRoles('SELLER')
  @Get('seller/items')
  @ApiOperation({ summary: 'List stock items for the authenticated seller' })
  async sellerItems(@CurrentUser() user: ServiceUser) {
    return { items: await this.inventory.sellerItems(user.id) };
  }

  @ApiBearerAuth()
  @RequireRoles('SELLER')
  @Get('seller/items/:productId/movements')
  @ApiOperation({ summary: 'Read stock movement history for one product' })
  movements(
    @CurrentUser() user: ServiceUser,
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ) {
    return this.inventory.movements(user.id, productId);
  }

  @ApiBearerAuth()
  @RequireRoles('SELLER')
  @Post('seller/items/:productId/adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adjust on-hand stock through the inventory ledger' })
  adjust(
    @CurrentUser() user: ServiceUser,
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventory.adjust(user.id, productId, dto);
  }

  @ApiBearerAuth()
  @RequireRoles('SELLER')
  @Patch('seller/items/:productId/settings')
  @ApiOperation({ summary: 'Update low-stock threshold or unit for one stock item' })
  settings(
    @CurrentUser() user: ServiceUser,
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Body() dto: StockSettingsDto,
  ) {
    return this.inventory.updateSettings(user.id, productId, dto);
  }
}
