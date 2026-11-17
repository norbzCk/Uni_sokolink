import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '@sokolink/platform';
import { PrismaService } from '../prisma/prisma.service';

interface GrantRoleBody {
  role?: string;
}

export interface SellerEligibility {
  eligible: boolean;
  reason: string;
  customerCategory: string;
  institution: string | null;
  studentRegistrationNumber: string | null;
}

@ApiTags('internal')
@Public()
@Controller({ path: 'internal/users', version: '1' })
export class InternalUsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Post(':userId/roles')
  @ApiOperation({ summary: 'Internal role grant for trusted services' })
  async grantRole(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() body: GrantRoleBody,
    @Req() request: Request,
  ) {
    this.assertInternalAccess(request);
    if (body.role !== 'SELLER') {
      throw new UnauthorizedException({
        code: 'ROLE_GRANT_NOT_ALLOWED',
        message: 'Only seller access can be granted through this internal route.',
      });
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      throw new UnauthorizedException({
        code: 'USER_NOT_FOUND',
        message: 'The account to approve no longer exists.',
      });
    }

    await this.prisma.userRole.upsert({
      where: { userId_role: { userId, role: 'SELLER' } },
      create: { userId, role: 'SELLER' },
      update: {},
    });

    return { userId, role: 'SELLER', granted: true };
  }

  @Get(':userId/seller-eligibility')
  @ApiOperation({ summary: 'Internal IFM seller eligibility check for trusted services' })
  async sellerEligibility(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Req() request: Request,
  ): Promise<SellerEligibility> {
    this.assertInternalAccess(request);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        customerCategory: true,
        institution: true,
        studentRegistrationNumber: true,
        emailVerifiedAt: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException({
        code: 'USER_NOT_FOUND',
        message: 'The account to approve no longer exists.',
      });
    }

    const eligibility = {
      customerCategory: user.customerCategory,
      institution: user.institution,
      studentRegistrationNumber: user.studentRegistrationNumber,
    };
    if (user.customerCategory !== 'STUDENT') {
      return { ...eligibility, eligible: false, reason: 'Only IFM students can sell at launch.' };
    }
    if (!this.isIfmInstitution(user.institution)) {
      return { ...eligibility, eligible: false, reason: 'A registered IFM institution is required.' };
    }
    if (!user.studentRegistrationNumber?.trim()) {
      return { ...eligibility, eligible: false, reason: 'A student registration number is required.' };
    }
    if (!user.emailVerifiedAt) {
      return { ...eligibility, eligible: false, reason: 'The account email address is not verified.' };
    }
    return {
      ...eligibility,
      eligible: true,
      reason: 'The account is eligible for IFM seller review.',
    };
  }

  private assertInternalAccess(request: Request): void {
    const expected = process.env.INTERNAL_SERVICE_TOKEN ?? 'local-internal-token';
    if (request.header('x-internal-token') !== expected) {
      throw new UnauthorizedException({
        code: 'INTERNAL_ACCESS_DENIED',
        message: 'Internal service access is not authorised.',
      });
    }
  }

  private isIfmInstitution(institution: string | null): boolean {
    const normalized = institution?.trim().toUpperCase().replace(/\s+/g, ' ');
    return normalized === 'IFM' || normalized === 'INSTITUTE OF FINANCE MANAGEMENT';
  }
}
