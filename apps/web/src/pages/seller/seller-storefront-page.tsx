import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, resolveMediaUrl } from '../../api/client';
import type { MySellerStatus, Storefront } from '../../api/marketplace';
import { useAuth } from '../../auth/auth-context';
import { Alert } from '../../components/alert';
import { LoadingState } from '../../components/async-state';
import { FormField } from '../../components/form-field';
import { useApi } from '../../lib/use-api';

const EMPTY = {
  businessName: '',
  businessCategory: '',
  region: 'Dar es Salaam',
  district: '',
  phone: '',
  email: '',
  description: '',
  status: 'ACTIVE' as 'ACTIVE' | 'PAUSED',
  logoDataUrl: '',
};

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('The logo could not be read.'));
    reader.readAsDataURL(file);
  });
}

export function SellerStorefrontPage() {
  const { authRequest } = useAuth();
  const profile = useApi(() => authRequest<{ storefront: Storefront | null }>('/seller/profile'), []);
  const status = useApi(() => authRequest<MySellerStatus>('/seller/applications/me'), []);
  const [form, setForm] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (profile.loading || status.loading || loaded) return;
    const storefront = profile.data?.storefront;
    const application = status.data?.application;
    setForm({
      businessName: storefront?.businessName ?? application?.businessName ?? '',
      businessCategory: storefront?.businessCategory ?? application?.businessCategory ?? '',
      region: storefront?.region ?? application?.region ?? 'Dar es Salaam',
      district: storefront?.district ?? application?.district ?? '',
      phone: storefront?.phone ?? application?.phone ?? '',
      email: storefront?.email ?? '',
      description: storefront?.description ?? application?.description ?? '',
      status: storefront?.status ?? 'ACTIVE',
      logoDataUrl: '',
    });
    setLoaded(true);
  }, [profile.loading, profile.data, status.loading, status.data, loaded]);

  if (profile.loading || status.loading || !loaded) {
    return <LoadingState label="Loading storefront" />;
  }

  const storefront = profile.data?.storefront ?? null;

  function field(name: keyof typeof form) {
    return {
      value: form[name],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((current) => ({ ...current, [name]: event.target.value })),
    };
  }

  async function pickLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError('Upload a JPEG, PNG or WebP logo.');
      return;
    }
    if (file.size > 1_500_000) {
      setError('The logo must be 1.5 MB or smaller.');
      return;
    }
    try {
      const logoDataUrl = await readFile(file);
      setForm((current) => ({ ...current, logoDataUrl }));
    } catch {
      setError('The logo could not be read. Try another file.');
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await authRequest<{ storefront: Storefront }>('/seller/profile', {
        method: 'PUT',
        body: JSON.stringify({
          businessName: form.businessName.trim(),
          businessCategory: form.businessCategory.trim(),
          region: form.region.trim(),
          district: form.district.trim(),
          phone: form.phone.trim(),
          ...(form.email.trim() ? { email: form.email.trim() } : {}),
          description: form.description.trim(),
          status: form.status,
          ...(form.logoDataUrl ? { logoDataUrl: form.logoDataUrl } : {}),
        }),
      });
      profile.setData(result);
      setForm((current) => ({ ...current, logoDataUrl: '' }));
      setMessage('Storefront saved.');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The storefront could not be saved.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">STOREFRONT</p>
          <h1>{storefront ? 'Your public storefront' : 'Set up your storefront'}</h1>
          <p className="muted">Buyers see this business profile alongside your products.</p>
        </div>
        {storefront && (
          <Link className="button button-outline" to={'/s/' + storefront.slug}>View public page</Link>
        )}
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <form className="account-card product-form" onSubmit={submit}>
        <FormField label="Business name" name="businessName" minLength={2} maxLength={160} required {...field('businessName')} />
        <FormField label="Business category" name="businessCategory" minLength={2} maxLength={120} required {...field('businessCategory')} />
        <div className="form-grid">
          <FormField label="Region" name="region" minLength={2} maxLength={80} required {...field('region')} />
          <FormField label="District" name="district" minLength={2} maxLength={80} required {...field('district')} />
          <FormField label="Phone" name="phone" type="tel" placeholder="+255712345678" required {...field('phone')} />
          <FormField label="Email (optional)" name="email" type="email" {...field('email')} />
        </div>
        <label className="field">
          <span>About your business</span>
          <textarea rows={5} minLength={20} maxLength={3000} required value={form.description} onChange={field('description').onChange} />
        </label>
        <label className="field">
          <span>Storefront status</span>
          <select value={form.status} onChange={field('status').onChange}>
            <option value="ACTIVE">Active — visible to buyers</option>
            <option value="PAUSED">Paused — hidden from buyers</option>
          </select>
        </label>
        <div className="field">
          <span>Logo (optional)</span>
          <div className="logo-upload">
            {storefront?.logoUrl && !form.logoDataUrl && (
              <img src={resolveMediaUrl(storefront.logoUrl) ?? ''} alt="Current logo" />
            )}
            {form.logoDataUrl && <img src={form.logoDataUrl} alt="New logo preview" />}
            <label className="button button-outline button-small">
              Choose logo
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickLogo} hidden />
            </label>
          </div>
          <span className="field-hint">JPEG, PNG or WebP up to 1.5 MB.</span>
        </div>
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? 'Saving…' : storefront ? 'Save storefront' : 'Create storefront'}
        </button>
      </form>
    </div>
  );
}
