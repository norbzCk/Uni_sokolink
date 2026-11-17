import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { loadEnvironment } from '../environment';
import type {
  RejectSellerApplicationDto,
  SellerApplicationDto,
  SellerProfileDto,
} from './seller.dto';

const SELLER_ROLE = 'SELLER';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
}

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

function parseImage(dataUrl: string): { data: Uint8Array<ArrayBuffer>; contentType: string } {
  const match = DATA_URL.exec(dataUrl);
  if (!match?.[1] || !match[2]) {
    throw new BadRequestException({
      code: 'INVALID_LOGO',
      message: 'Upload a JPEG, PNG or WebP logo.',
      fieldErrors: { logoDataUrl: 'Upload a JPEG, PNG or WebP logo.' },
    });
  }
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.byteLength > 1_500_000) {
    throw new BadRequestException({
      code: 'LOGO_TOO_LARGE',
      message: 'The logo must be 1.5 MB or smaller.',
      fieldErrors: { logoDataUrl: 'The logo must be 1.5 MB or smaller.' },
    });
  }
  return { data: new Uint8Array(buffer), contentType: match[1] };
}

@Injectable()
export class SellerService {
  constructor(private readonly prisma: PrismaService) {}

  async submitApplication(userId: string, dto: SellerApplicationDto) {
    const profile = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    if (profile) {
      throw new ConflictException({
        code: 'SELLER_ALREADY_APPROVED',
        message: 'Your seller storefront is already active.',
      });
    }
    const existing = await this.prisma.sellerApplication.findUnique({ where: { userId } });
    if (existing?.status === 'PENDING') {
      throw new ConflictException({
        code: 'APPLICATION_ALREADY_PENDING',
        message: 'Your seller application is already waiting for review.',
      });
    }
    return this.prisma.sellerApplication.upsert({
      where: { userId },
      create: { userId, ...dto, status: 'PENDING', submittedAt: new Date() },
      update: {
        ...dto,
        status: 'PENDING',
        rejectionReason: null,
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
      },
    });
  }

  async getMyApplication(userId: string) {
    const application = await this.prisma.sellerApplication.findUnique({ where: { userId } });
    const profile = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    return {
      application: application ? this.presentApplication(application) : null,
      storefront: profile ? this.presentProfile(profile) : null,
    };
  }

  async listApplications(status?: string) {
    const allowed = new Set(['PENDING', 'APPROVED', 'REJECTED']);
    const where = status && allowed.has(status) ? { status: status as 'PENDING' } : {};
    const applications = await this.prisma.sellerApplication.findMany({
      where,
      orderBy: [{ status: 'asc' }, { submittedAt: 'asc' }],
      take: 100,
    });
    return applications.map((application) => this.presentApplication(application));
  }

  async approveApplication(applicationId: string, reviewerId: string) {
    const application = await this.prisma.sellerApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application) {
      throw new NotFoundException({
        code: 'APPLICATION_NOT_FOUND',
        message: 'That seller application no longer exists.',
      });
    }
    if (application.status === 'APPROVED') {
      return this.presentApplication(application);
    }

    await this.grantSellerRole(application.userId);

    const slug = await this.availableSlug(application.businessName, application.userId);
    const [, updated] = await this.prisma.$transaction([
      this.prisma.sellerProfile.upsert({
        where: { userId: application.userId },
        create: {
          userId: application.userId,
          businessName: application.businessName,
          businessCategory: application.businessCategory,
          region: application.region,
          district: application.district,
          phone: application.phone,
          description: application.description,
          slug,
          status: 'ACTIVE',
        },
        update: {
          businessName: application.businessName,
          businessCategory: application.businessCategory,
          region: application.region,
          district: application.district,
          phone: application.phone,
          description: application.description,
          status: 'ACTIVE',
        },
      }),
      this.prisma.sellerApplication.update({
        where: { id: application.id },
        data: {
          status: 'APPROVED',
          rejectionReason: null,
          reviewedAt: new Date(),
          reviewedBy: reviewerId,
        },
      }),
    ]);
    return this.presentApplication(updated);
  }

  async rejectApplication(
    applicationId: string,
    reviewerId: string,
    dto: RejectSellerApplicationDto,
  ) {
    const application = await this.prisma.sellerApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application) {
      throw new NotFoundException({
        code: 'APPLICATION_NOT_FOUND',
        message: 'That seller application no longer exists.',
      });
    }
    if (application.status === 'APPROVED') {
      throw new ConflictException({
        code: 'APPLICATION_ALREADY_APPROVED',
        message: 'An approved seller application cannot be rejected.',
      });
    }
    const updated = await this.prisma.sellerApplication.update({
      where: { id: application.id },
      data: {
        status: 'REJECTED',
        rejectionReason: dto.reason,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      },
    });
    return this.presentApplication(updated);
  }

  async getMyProfile(userId: string) {
    const profile = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    return { storefront: profile ? this.presentProfile(profile) : null };
  }

  async saveProfile(userId: string, dto: SellerProfileDto) {
    const existing = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    const logo = dto.logoDataUrl ? parseImage(dto.logoDataUrl) : undefined;

    if (!existing) {
      const application = await this.prisma.sellerApplication.findUnique({ where: { userId } });
      if (!application || application.status !== 'APPROVED') {
        throw new ConflictException({
          code: 'SELLER_NOT_APPROVED',
          message: 'Your seller account must be approved before you can open a storefront.',
        });
      }
      const slug = await this.availableSlug(dto.businessName, userId);
      const created = await this.prisma.sellerProfile.create({
        data: {
          userId,
          slug,
          businessName: dto.businessName,
          businessCategory: dto.businessCategory,
          region: dto.region,
          district: dto.district,
          phone: dto.phone,
          email: dto.email ?? null,
          description: dto.description,
          status: dto.status ?? 'ACTIVE',
          ...(logo ? { logoData: logo.data, logoContentType: logo.contentType } : {}),
        },
      });
      return { storefront: this.presentProfile(created) };
    }

    const updated = await this.prisma.sellerProfile.update({
      where: { userId },
      data: {
        businessName: dto.businessName,
        businessCategory: dto.businessCategory,
        region: dto.region,
        district: dto.district,
        phone: dto.phone,
        email: dto.email ?? null,
        description: dto.description,
        status: dto.status ?? existing.status,
        ...(logo ? { logoData: logo.data, logoContentType: logo.contentType } : {}),
      },
    });
    return { storefront: this.presentProfile(updated) };
  }

  async listPublicStorefronts() {
    const profiles = await this.prisma.sellerProfile.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 24,
    });
    return profiles.map((profile) => this.presentProfile(profile, true));
  }

  async getPublicStorefront(slug: string) {
    const profile = await this.prisma.sellerProfile.findUnique({ where: { slug } });
    if (!profile) {
      throw new NotFoundException({
        code: 'STOREFRONT_NOT_FOUND',
        message: 'That seller storefront could not be found.',
      });
    }
    return this.presentProfile(profile, true);
  }

  async getPublicLogo(storefrontId: string) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { id: storefrontId },
      select: { logoData: true, logoContentType: true },
    });
    if (!profile?.logoData || !profile.logoContentType) {
      throw new NotFoundException({ code: 'LOGO_NOT_FOUND', message: 'Logo not found.' });
    }
    return { data: Buffer.from(profile.logoData), contentType: profile.logoContentType };
  }

  async internalSummary(userId: string) {
    const profile = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    if (!profile) {
      return { sellerId: userId, businessName: null, slug: null };
    }
    return {
      sellerId: userId,
      businessName: profile.businessName,
      slug: profile.slug,
      status: profile.status,
    };
  }

  private async availableSlug(businessName: string, userId: string): Promise<string> {
    const base = slugify(businessName) || 'seller';
    const taken = await this.prisma.sellerProfile.findUnique({ where: { slug: base } });
    if (!taken || taken.userId === userId) {
      return base;
    }
    return base.slice(0, 120) + '-' + randomBytes(3).toString('hex');
  }

  private async grantSellerRole(userId: string): Promise<void> {
    const env = loadEnvironment();
    let response: Response;
    try {
      response = await fetch(
        env.IDENTITY_SERVICE_URL + '/api/v1/internal/users/' + userId + '/roles',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-internal-token': env.INTERNAL_SERVICE_TOKEN,
          },
          body: JSON.stringify({ role: SELLER_ROLE }),
          signal: AbortSignal.timeout(5000),
        },
      );
    } catch {
      throw new BadGatewayException({
        code: 'IDENTITY_UNAVAILABLE',
        message: 'Seller approval could not be completed because identity is unavailable.',
      });
    }
    if (!response.ok) {
      throw new BadGatewayException({
        code: 'ROLE_GRANT_FAILED',
        message: 'Seller approval could not be completed. Try again shortly.',
      });
    }
  }

  private presentApplication(application: {
    id: string;
    userId: string;
    businessName: string;
    businessCategory: string;
    region: string;
    district: string;
    phone: string;
    description: string;
    status: string;
    rejectionReason: string | null;
    submittedAt: Date;
    reviewedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: application.id,
      userId: application.userId,
      businessName: application.businessName,
      businessCategory: application.businessCategory,
      region: application.region,
      district: application.district,
      phone: application.phone,
      description: application.description,
      status: application.status,
      rejectionReason: application.rejectionReason,
      submittedAt: application.submittedAt.toISOString(),
      reviewedAt: application.reviewedAt?.toISOString() ?? null,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    };
  }

  private presentProfile(
    profile: {
      id: string;
      userId: string;
      businessName: string;
      slug: string;
      businessCategory: string;
      region: string;
      district: string;
      phone: string;
      email: string | null;
      description: string;
      logoContentType: string | null;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    },
    publicView = false,
  ) {
    return {
      id: profile.id,
      userId: profile.userId,
      businessName: profile.businessName,
      slug: profile.slug,
      businessCategory: profile.businessCategory,
      region: profile.region,
      district: profile.district,
      phone: profile.phone,
      email: publicView ? null : profile.email,
      description: profile.description,
      logoUrl: profile.logoContentType ? '/seller/storefronts/' + profile.id + '/logo' : null,
      status: profile.status,
      verified: true,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
