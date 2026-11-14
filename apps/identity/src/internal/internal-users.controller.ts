import {
  Body,
  Controller,
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
    const expected = process.env.INTERNAL_SERVICE_TOKEN ?? 'local-internal-token';
    if (request.header('x-internal-token') !== expected) {
      throw new UnauthorizedException({
        code: 'INTERNAL_ACCESS_DENIED',
        message: 'Internal service access is not authorised.',
      });
    }
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
}
