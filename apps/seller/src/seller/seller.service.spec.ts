import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SellerApplicationDto } from './seller.dto';
import { SellerService } from './seller.service';

const fetchMock = vi.fn();
const dates = {
  submittedAt: new Date('2026-01-01T00:00:00Z'),
  reviewedAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const application = {
  id: 'app-1',
  userId: 'user-1',
  businessName: 'IFM Supply Co',
  businessCategory: 'Stationery',
  region: 'Dar es Salaam',
  district: 'Kinondoni',
  phone: '+255712345678',
  institution: 'IFM',
  studentRegistrationNumber: '2024/12345',
  evidenceReference: 'IFM-STUDENT-ID-12345',
  description: 'Affordable stationery for students around the IFM campus.',
  status: 'PENDING',
  rejectionReason: null,
  ...dates,
};

const submission: SellerApplicationDto = {
  businessName: application.businessName,
  businessCategory: application.businessCategory,
  region: application.region,
  district: application.district,
  phone: application.phone,
  institution: application.institution,
  studentRegistrationNumber: application.studentRegistrationNumber,
  evidenceReference: application.evidenceReference,
  description: application.description,
};

function eligibilityResponse(eligible: boolean, reason = 'Only IFM students can sell at launch.') {
  return {
    ok: true,
    json: async () => ({ eligible, reason }),
  };
}

function build(existingApplication: unknown = null) {
  const sellerApplication = {
    findUnique: vi.fn().mockResolvedValue(existingApplication),
    upsert: vi.fn().mockResolvedValue(application),
    update: vi.fn().mockResolvedValue({ ...application, status: 'APPROVED' }),
  };
  const profile = {
    id: 'profile-1',
    userId: 'user-1',
    businessName: application.businessName,
    slug: 'ifm-supply-co',
    businessCategory: application.businessCategory,
    region: application.region,
    district: application.district,
    phone: application.phone,
    email: null,
    description: application.description,
    logoContentType: null,
    status: 'ACTIVE',
    verified: false,
    ...dates,
  };
  const sellerProfile = {
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(profile),
    create: vi.fn().mockResolvedValue(profile),
    update: vi.fn().mockResolvedValue(profile),
    upsert: vi.fn().mockResolvedValue({ ...profile, verified: true }),
  };
  const prisma = {
    sellerApplication,
    sellerProfile,
    $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  return { service: new SellerService(prisma as never), sellerApplication, sellerProfile, prisma };
}

describe('seller business rules', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('rejects an application when identity reports an ineligible account', async () => {
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(eligibilityResponse(false)));
    const { service, sellerApplication } = build();

    await expect(service.submitApplication('user-1', submission)).rejects.toMatchObject({
      response: { code: 'SELLER_INELIGIBLE' },
    });
    expect(sellerApplication.upsert).not.toHaveBeenCalled();
  });

  it('rejects approval without IFM evidence before granting seller access', async () => {
    vi.stubGlobal('fetch', fetchMock);
    const { service } = build({
      ...application,
      institution: 'OTHER',
    });

    await expect(service.approveApplication('app-1', 'admin-1')).rejects.toMatchObject({
      response: { code: 'IFM_EVIDENCE_REQUIRED' },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('creates a verified storefront after a valid approval', async () => {
    vi.stubGlobal(
      'fetch',
      fetchMock.mockImplementation(async (url: string) =>
        url.includes('seller-eligibility')
          ? eligibilityResponse(true, 'The account is eligible for IFM seller review.')
          : { ok: true },
      ),
    );
    const { service, sellerProfile } = build(application);

    const result = await service.approveApplication('app-1', 'admin-1');

    expect(result).toMatchObject({ status: 'APPROVED' });
    const profileCall = sellerProfile.upsert.mock.calls[0]?.[0] as {
      create: { verified: boolean };
      update: { verified: boolean };
    };
    expect(profileCall.create.verified).toBe(true);
    expect(profileCall.update.verified).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
