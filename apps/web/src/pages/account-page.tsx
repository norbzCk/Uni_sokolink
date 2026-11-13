import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth, type User } from '../auth/auth-context';
import { Alert } from '../components/alert';
import { FormField } from '../components/form-field';
import { ResendVerificationForm } from '../components/resend-verification-form';

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: 'Customer',
  SELLER: 'Seller',
  DELIVERY_PARTNER: 'Delivery partner',
  ADMIN: 'Administrator',
  SUPER_ADMIN: 'Super administrator',
};

export function AccountPage() {
  const { user, authRequest, signOut, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (!user) {
    return null;
  }

  const currentUser: User = user;

  async function requestCode() {
    setSending(true);
    setMessage(null);
    setError(null);
    try {
      await authRequest('/auth/phone/request', { method: 'POST' });
      setCodeSent(true);
      setMessage('A six digit verification code was sent to your phone number.');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The verification code could not be sent.');
    } finally {
      setSending(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVerifying(true);
    setMessage(null);
    setError(null);
    try {
      await authRequest<{ user: User }>('/auth/phone/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      await refreshSession();
      setCode('');
      setCodeSent(false);
      setMessage('Your phone number is verified.');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The code could not be verified.');
    } finally {
      setVerifying(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/', { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <section className="page-wrap account-page">
      <p className="eyebrow">YOUR ACCOUNT</p>
      <div className="account-heading">
        <div>
          <h1>{currentUser.fullName}</h1>
          <p className="muted">Member since {new Date(currentUser.createdAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</p>
        </div>
        <button className="button button-outline" type="button" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>

      {message && <Alert tone="success">{message}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <div className="account-grid">
        <article className="account-card">
          <h2>Contact details</h2>
          <dl className="detail-list">
            <div>
              <dt>Email</dt>
              <dd>{currentUser.email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{currentUser.phone}</dd>
            </div>
          </dl>
          <div className="verification-row">
            <span className={'badge ' + (currentUser.emailVerified ? 'badge-success' : 'badge-warning')}>
              {currentUser.emailVerified ? 'Email verified' : 'Email not verified'}
            </span>
            <span className={'badge ' + (currentUser.phoneVerified ? 'badge-success' : 'badge-warning')}>
              {currentUser.phoneVerified ? 'Phone verified' : 'Phone not verified'}
            </span>
          </div>
          {!currentUser.emailVerified && <ResendVerificationForm initialEmail={currentUser.email} />}
          {!currentUser.phoneVerified && (
            <div className="phone-verification">
              <h3>Verify your phone number</h3>
              {!codeSent ? (
                <button className="button button-outline" type="button" onClick={requestCode} disabled={sending}>
                  {sending ? 'Sending…' : 'Send verification code'}
                </button>
              ) : (
                <form onSubmit={verifyCode} className="inline-verification-form">
                  <FormField
                    label="Six digit code"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  <button className="button button-primary" type="submit" disabled={verifying || code.length !== 6}>
                    {verifying ? 'Verifying…' : 'Verify phone'}
                  </button>
                </form>
              )}
            </div>
          )}
        </article>

        <article className="account-card">
          <h2>Account access</h2>
          <p className="muted">Roles are granted by SokoLink. They cannot be changed from this page.</p>
          <ul className="role-list">
            {currentUser.roles.map((role) => (
              <li key={role} className="badge badge-neutral">{ROLE_LABELS[role] ?? role}</li>
            ))}
          </ul>
          <div className="account-links">
            {currentUser.roles.includes('SELLER') && <Link className="text-link" to="/seller">Open seller workspace</Link>}
            {(currentUser.roles.includes('ADMIN') || currentUser.roles.includes('SUPER_ADMIN')) && (
              <Link className="text-link" to="/admin">Open administration</Link>
            )}
            <Link className="text-link" to="/">Browse the marketplace</Link>
          </div>
        </article>
      </div>
    </section>
  );
}
