import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
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
import { RejectSellerApplicationDto, SellerApplicationDto, SellerProfileDto } from './seller.dto';
import { SellerService } from './seller.service';

@ApiTags('seller')
@Controller({ path: 'seller', version: '1' })
export class SellerController {
  constructor(private readonly seller: SellerService) {}

  @Public()
  @Get('storefronts')
  @ApiOperation({ summary: 'List active seller storefronts' })
  listStorefronts() {
    return this.seller.listPublicStorefronts();
  }

  @Public()
  @Get('storefronts/:slug')
  @ApiOperation({ summary: 'Read a public seller storefront' })
  getStorefront(@Param('slug') slug: string) {
    return this.seller.getPublicStorefront(slug);
  }

  @Public()
  @Get('storefronts/:id/logo')
  @Header('Cache-Control', 'public, max-age=3600')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({ summary: 'Serve a seller storefront logo' })
  async getLogo(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const logo = await this.seller.getPublicLogo(id);
    response.setHeader('Content-Type', logo.contentType);
    return logo.data;
  }

  @ApiBearerAuth()
  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit or resubmit a seller application' })
  submitApplication(@CurrentUser() user: ServiceUser, @Body() dto: SellerApplicationDto) {
    return this.seller.submitApplication(user.id, dto);
  }

  @ApiBearerAuth()
  @Get('applications/me')
  @ApiOperation({ summary: 'Read the authenticated seller application and storefront' })
  myApplication(@CurrentUser() user: ServiceUser) {
    return this.seller.getMyApplication(user.id);
  }

  @ApiBearerAuth()
  @RequireRoles('SELLER')
  @Get('profile')
  @ApiOperation({ summary: 'Read the authenticated seller storefront profile' })
  myProfile(@CurrentUser() user: ServiceUser) {
    return this.seller.getMyProfile(user.id);
  }

  @ApiBearerAuth()
  @RequireRoles('SELLER')
  @Put('profile')
  @ApiOperation({ summary: 'Create or update the authenticated seller storefront profile' })
  saveProfile(@CurrentUser() user: ServiceUser, @Body() dto: SellerProfileDto) {
    return this.seller.saveProfile(user.id, dto);
  }

  @ApiBearerAuth()
  @RequireRoles('ADMIN')
  @Get('admin/applications')
  @ApiOperation({ summary: 'List seller applications for administrator review' })
  async listApplications(@Query('status') status?: string) {
    return { applications: await this.seller.listApplications(status) };
  }

  @ApiBearerAuth()
  @RequireRoles('ADMIN')
  @Post('admin/applications/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a seller application and grant seller access' })
  approveApplication(
    @CurrentUser() user: ServiceUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.seller.approveApplication(id, user.id);
  }

  @ApiBearerAuth()
  @RequireRoles('ADMIN')
  @Post('admin/applications/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a seller application with a reason' })
  rejectApplication(
    @CurrentUser() user: ServiceUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectSellerApplicationDto,
  ) {
    return this.seller.rejectApplication(id, user.id, dto);
  }

  @Public()
  @Get('internal/users/:userId/summary')
  @ApiOperation({ summary: 'Internal seller summary for other services' })
  internalSummary(@Param('userId', new ParseUUIDPipe()) userId: string, @Req() request: Request) {
    requireInternalToken(request.header('x-internal-token'));
    return this.seller.internalSummary(userId);
  }
}
