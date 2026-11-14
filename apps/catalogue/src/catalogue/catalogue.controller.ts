import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  CurrentUser,
  Public,
  RequireRoles,
  requireInternalToken,
  type ServiceUser,
} from '@sokolink/platform';
import {
  AddProductImageDto,
  AdminProductQuery,
  CreateProductDto,
  ListProductsQuery,
  RejectProductDto,
  SellerProductQuery,
  UpdateProductDto,
} from './catalogue.dto';
import { CatalogueService } from './catalogue.service';
import type { ProductStatus } from '../generated/prisma';

@ApiTags('catalogue')
@Controller({ path: 'catalogue', version: '1' })
export class CatalogueController {
  constructor(private readonly catalogue: CatalogueService) {}

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'List marketplace categories with approved listing counts' })
  categories() {
    return this.catalogue.listCategories();
  }

  @Public()
  @Get('products')
  @ApiOperation({ summary: 'Search and browse approved marketplace products' })
  products(@Query() query: ListProductsQuery) {
    return this.catalogue.listProducts(query);
  }

  @Public()
  @Get('products/:id')
  @ApiOperation({ summary: 'Read an approved product by id or slug' })
  product(@Param('id') id: string) {
    return this.catalogue.getProduct(id);
  }

  @Public()
  @Get('products/:id/related')
  @ApiOperation({ summary: 'List related approved products' })
  related(@Param('id') id: string) {
    return this.catalogue.getRelatedProducts(id);
  }

  @Public()
  @Get('images/:id')
  @Header('Cache-Control', 'public, max-age=86400')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({ summary: 'Serve a product image' })
  async image(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const image = await this.catalogue.getImage(id);
    response.setHeader('Content-Type', image.contentType);
    return image.data;
  }

  @ApiBearerAuth()
  @RequireRoles('SELLER')
  @Get('seller/products')
  @ApiOperation({ summary: 'List products owned by the authenticated seller' })
  sellerProducts(@CurrentUser() user: ServiceUser, @Query() query: SellerProductQuery) {
    return this.catalogue.listSellerProducts(user.id, query);
  }

  @ApiBearerAuth()
  @RequireRoles('SELLER')
  @Get('seller/products/:id')
  @ApiOperation({ summary: 'Read one product owned by the authenticated seller' })
  sellerProduct(
    @CurrentUser() user: ServiceUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalogue.getSellerProduct(user.id, id);
  }

  @ApiBearerAuth()
  @RequireRoles('SELLER')
  @Get('seller/stats')
  @ApiOperation({ summary: 'Count seller products by moderation status' })
  stats(@CurrentUser() user: ServiceUser) {
    return this.catalogue.sellerStats(user.id);
  }

  @ApiBearerAuth()
  @RequireRoles('SELLER')
  @Post('seller/products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a draft product with opening stock' })
  createProduct(@CurrentUser() user: ServiceUser, @Body() dto: CreateProductDto) {
    return this.catalogue.createProduct(user, dto);
  }

  @ApiBearerAuth()
  @RequireRoles('SELLER')
  @Post('seller/products/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a product owned by the authenticated seller' })
  updateProduct(
    @CurrentUser() user: ServiceUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalogue.updateProduct(user, id, dto);
  }

  @ApiBearerAuth()
  @RequireRoles('SELLER')
  @Post('seller/products/:id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a product for administrator review' })
  submit(@CurrentUser() user: ServiceUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.catalogue.submitProduct(user.id, id);
  }

  @ApiBearerAuth()
  @RequireRoles('SELLER')
  @Post('seller/products/:id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a product and remove it from the public catalogue' })
  archive(@CurrentUser() user: ServiceUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.catalogue.archiveProduct(user.id, id);
  }

  @ApiBearerAuth()
  @RequireRoles('SELLER')
  @Post('seller/products/:id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore an archived product to draft' })
  restore(@CurrentUser() user: ServiceUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.catalogue.restoreProduct(user.id, id);
  }

  @ApiBearerAuth()
  @RequireRoles('SELLER')
  @Post('seller/products/:id/images')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a product image' })
  addImage(
    @CurrentUser() user: ServiceUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddProductImageDto,
  ) {
    return this.catalogue.addImage(user.id, id, dto);
  }

  @ApiBearerAuth()
  @RequireRoles('SELLER')
  @Delete('seller/products/:id/images/:imageId')
  @ApiOperation({ summary: 'Remove a product image' })
  removeImage(
    @CurrentUser() user: ServiceUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('imageId', new ParseUUIDPipe()) imageId: string,
  ) {
    return this.catalogue.removeImage(user.id, id, imageId);
  }

  @ApiBearerAuth()
  @RequireRoles('ADMIN')
  @Get('admin/products')
  @ApiOperation({ summary: 'List products awaiting moderation' })
  async adminProducts(@Query() query: AdminProductQuery) {
    return {
      items: await this.catalogue.adminListProducts(query.status as ProductStatus | undefined),
    };
  }

  @ApiBearerAuth()
  @RequireRoles('ADMIN')
  @Post('admin/products/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a marketplace product' })
  approve(@CurrentUser() user: ServiceUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.catalogue.adminApproveProduct(user.id, id);
  }

  @ApiBearerAuth()
  @RequireRoles('ADMIN')
  @Post('admin/products/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a marketplace product with a reason' })
  reject(
    @CurrentUser() user: ServiceUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectProductDto,
  ) {
    return this.catalogue.adminRejectProduct(user.id, id, dto.reason);
  }

  @Public()
  @Post('internal/products/batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal approved product lookup for checkout' })
  internalBatch(@Body() body: { ids?: string[] }, @Req() request: Request) {
    requireInternalToken(request.header('x-internal-token'));
    const ids = Array.isArray(body.ids) ? body.ids.slice(0, 100) : [];
    return this.catalogue.internalProductBatch(ids).then((items) => ({ items }));
  }
}
