import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, PackageCheck, Store, Truck } from 'lucide-react';
import { ApiError } from '../api/client';
import type { MySellerStatus, SellerApplication } from '../api/marketplace';
import { useAuth } from '../auth/auth-context';
import { Alert } from '../components/alert';
import { LoadingState } from '../components/async-state';
import { FormField } from '../components/form-field';
import { formatDate, statusTone } from '../lib/format';
import { useApi } from '../lib/use-api';

const EMPTY_FORM = {
  businessName: '',
  businessCategory: '',
  region: 'Dar es Salaam',
  district: '',
  phone: '',
  institution: 'IFM',
  studentRegistrationNumber: '',
  evidenceReference: '',
  description: '',
};

export function SellPage() {
  const { user, status: sessionStatus, authRequest, refreshSession } = useAuth();
  const sellerStatus = useApi(
    user ? () => authRequest<MySellerStatus>('/seller/applications/me') : null,
    [user?.id],
  );
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (sessionStatus === 'loading') {
    return <section className="page-wrap"><LoadingState label="Checking your session" /></section>;
  }
  if (user?.roles.includes('SELLER')) return <Navigate to="/seller" replace />;

  const application = sellerStatus.data?.application ?? null;

  function field(name: keyof typeof EMPTY_FORM) {
    return {
      value: form[name],
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((current) => ({ ...current, [name]: event.target.value })),
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await authRequest<SellerApplication>('/seller/applications', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      sellerStatus.setData((current) => ({ application: result, storefront: current?.storefront ?? null }));
      await refreshSession();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Your application could not be submitted.');
    } finally {
      setPending(false);
    }
  }

  if (user && sellerStatus.loading) {
    return <section className="page-wrap"><LoadingState label="Loading seller status" /></section>;
  }

  return (
    <section className="page-wrap sell-page">
      <div className="sell-hero">
        <div>
          <p className="eyebrow">SELL ON SOKOLINK</p>
          <h1>Turn what you make into a storefront.</h1>
          <p>
            IFM students can apply once. When an administrator verifies your evidence and approves
            your business, you can publish products, manage stock and fulfil orders.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/help">Seller guide <ArrowRight size={15} /></Link>
            <Link className="button button-outline" to="/about">How SokoLink works</Link>
          </div>
        </div>
        <div className="sell-hero-panel">
          <div className="sell-hero-row"><Store size={18} /><div><strong>Your own storefront</strong><span>A shareable shop page for your business.</span></div></div>
          <div className="sell-hero-row"><PackageCheck size={18} /><div><strong>Simple stock control</strong><span>Track availability and low-stock alerts.</span></div></div>
          <div className="sell-hero-row"><Truck size={18} /><div><strong>Order fulfilment</strong><span>Confirm, process and ship from one workspace.</span></div></div>
        </div>
      </div>

      <div className="sell-benefits">
        <article>
          <BadgeCheck size={22} />
          <h3>Verified sellers</h3>
          <p>Every store is reviewed before it goes live, building trust with buyers.</p>
        </article>
        <article>
          <Store size={22} />
          <h3>Built for campus</h3>
          <p>Reach students with delivery or pickup options that fit campus life.</p>
        </article>
        <article>
          <Truck size={22} />
          <h3>Clear fulfilment</h3>
          <p>Track each order from placed to delivered with a simple status flow.</p>
        </article>
      </div>

      {!user && (
        <article className="account-card status-card sell-form">
          <span className="badge badge-warning">Seller access</span>
          <h2>Create an account to apply.</h2>
          <p className="muted">Sign in with your IFM student account to submit a seller application and track its review.</p>
          <div className="inline-actions">
            <Link className="button button-primary" to="/sign-up">Create account</Link>
            <Link className="button button-outline" to="/sign-in">Sign in</Link>
          </div>
        </article>
      )}

      {user && application && application.status === 'PENDING' && (
        <article className="account-card status-card sell-form">
          <span className={'badge ' + statusTone(application.status)}>Application under review</span>
          <h2>{application.businessName}</h2>
          <p className="muted">Submitted {formatDate(application.submittedAt)}. You will be able to open your seller workspace once approved.</p>
          <Link className="text-link" to="/account">Back to your account</Link>
        </article>
      )}

      {application && application.status === 'REJECTED' && (
        <Alert tone="error">
          Your application needs changes. {application.rejectionReason ?? 'Review the details and submit again.'}
        </Alert>
      )}

      {application && application.status === 'APPROVED' && (
        <article className="account-card status-card sell-form">
          <span className="badge badge-success">Approved</span>
          <h2>Your seller access is approved.</h2>
          <p className="muted">Refresh your session if the seller workspace does not appear yet.</p>
          <div className="inline-actions">
            <Link className="button button-primary" to="/seller">Open seller workspace</Link>
            <button className="button button-outline" type="button" onClick={() => void refreshSession()}>
              Refresh session
            </button>
          </div>
        </article>
      )}

      {user && (!application || application.status === 'REJECTED') && (
        <form className="account-card auth-form sell-form" onSubmit={submit}>
          <h2>{application ? 'Update and resubmit' : 'Seller application'}</h2>
          <p className="muted">
            Seller access is limited to IFM students at launch. Add your student evidence so an
            administrator can review it.
          </p>
          {error && <Alert tone="error">{error}</Alert>}
          <FormField label="Business name" name="businessName" minLength={2} maxLength={160} required {...field('businessName')} />
          <FormField label="Business category" name="businessCategory" placeholder="Home & Kitchen" minLength={2} maxLength={120} required {...field('businessCategory')} />
          <div className="form-grid">
            <FormField label="Region" name="region" minLength={2} maxLength={80} required {...field('region')} />
            <FormField label="District" name="district" minLength={2} maxLength={80} required {...field('district')} />
          </div>
          <FormField label="Business phone" name="phone" type="tel" placeholder="+255712345678" required {...field('phone')} />
          <FormField
            label="Institution"
            name="institution"
            readOnly
            hint="Seller access is limited to IFM students at launch."
            {...field('institution')}
          />
          <FormField
            label="Student registration number"
            name="studentRegistrationNumber"
            minLength={3}
            maxLength={64}
            required
            {...field('studentRegistrationNumber')}
          />
          <FormField
            label="Evidence reference"
            name="evidenceReference"
            minLength={3}
            maxLength={160}
            hint="Student ID or enrolment letter reference for manual review."
            required
            {...field('evidenceReference')}
          />
          <label className="field">
            <span>What will you sell?</span>
            <textarea
              rows={5}
              minLength={20}
              maxLength={3000}
              required
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </label>
          <button className="button button-primary" type="submit" disabled={pending}>
            {pending ? 'Submitting…' : application ? 'Resubmit application' : 'Submit application'}
          </button>
        </form>
      )}
    </section>
  );
}
