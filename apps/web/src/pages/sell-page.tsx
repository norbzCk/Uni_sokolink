import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
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
  description: '',
};

export function SellPage() {
  const { user, authRequest, refreshSession } = useAuth();
  const status = useApi(() => authRequest<MySellerStatus>('/seller/applications/me'), []);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!user) return null;
  if (user.roles.includes('SELLER')) return <Navigate to="/seller" replace />;

  const application = status.data?.application ?? null;

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
      status.setData((current) => ({ application: result, storefront: current?.storefront ?? null }));
      await refreshSession();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Your application could not be submitted.');
    } finally {
      setPending(false);
    }
  }

  if (status.loading) {
    return <section className="page-wrap"><LoadingState label="Loading seller status" /></section>;
  }

  return (
    <section className="page-wrap narrow-page sell-page">
      <p className="eyebrow">SELL ON SOKOLINK</p>
      <h1>Turn what you make into a storefront.</h1>
      <p className="muted">
        Apply once. When an administrator approves your business, you can publish products, manage stock and fulfil orders.
      </p>

      {application && application.status === 'PENDING' && (
        <article className="account-card status-card">
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
        <article className="account-card status-card">
          <span className="badge badge-success">Approved</span>
          <h2>Your seller access is approved.</h2>
          <p className="muted">Refresh your session if the seller workspace does not appear yet.</p>
          <Link className="button button-primary" to="/seller">Open seller workspace</Link>
        </article>
      )}

      {(!application || application.status === 'REJECTED') && (
        <form className="account-card auth-form" onSubmit={submit}>
          <h2>{application ? 'Update and resubmit' : 'Seller application'}</h2>
          {error && <Alert tone="error">{error}</Alert>}
          <FormField label="Business name" name="businessName" minLength={2} maxLength={160} required {...field('businessName')} />
          <FormField label="Business category" name="businessCategory" placeholder="Home & Kitchen" minLength={2} maxLength={120} required {...field('businessCategory')} />
          <div className="form-grid">
            <FormField label="Region" name="region" minLength={2} maxLength={80} required {...field('region')} />
            <FormField label="District" name="district" minLength={2} maxLength={80} required {...field('district')} />
          </div>
          <FormField label="Business phone" name="phone" type="tel" placeholder="+255712345678" required {...field('phone')} />
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
