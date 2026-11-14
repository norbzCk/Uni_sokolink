import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../common/auth.types';
import { requestMeta } from '../common/auth.types';
import { AuthService } from './auth.service';
import type { UserSummary } from './auth.types';
import { UpdateProfileDto } from './dto/account.dto';
import { UserEnvelopeResponseDto } from './dto/response.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly auth: AuthService) {}

  @RequirePermissions('auth.profile.read')
  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user profile and verification status' })
  @ApiResponse({ status: 200, type: UserEnvelopeResponseDto })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<{ user: UserSummary }> {
    return { user: await this.auth.getMe(user.id) };
  }

  @RequirePermissions('auth.profile.update')
  @Patch('me')
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiResponse({ status: 200, type: UserEnvelopeResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid profile fields' })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
    @Req() request: Request,
  ): Promise<{ user: UserSummary }> {
    return { user: await this.auth.updateProfile(user.id, dto.fullName, requestMeta(request)) };
  }
}
