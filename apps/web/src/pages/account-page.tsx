import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HelpCircle, LogOut, Package, Store } from 'lucide-react';
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
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [sessions, setSessions] = useState<Array<{
    id: string;
    createdAt: string;
    lastUsedAt: string | null;
    expiresAt: string;
    userAgent: string | null;
    current: boolean;
  }>>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    void authRequest<{ sessions: typeof sessions }>('/auth/sessions')
      .then((result) => setSessions(result.sessions))
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : 'Sessions could not be loaded.'));
  }, [authRequest]);

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

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    setMessage(null);
    setError(null);
    try {
      await authRequest('/users/me', { method: 'PATCH', body: JSON.stringify({ fullName }) });
      await refreshSession();
      setMessage('Your profile was updated.');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Your profile could not be updated.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== passwordConfirmation) {
      setError('The new passwords do not match.');
      return;
    }
    setChangingPassword(true);
    setMessage(null);
    setError(null);
    try {
      await authRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, password: newPassword, passwordConfirmation }),
      });
      await signOut();
      navigate('/sign-in', { replace: true, state: { message: 'Password changed. Sign in with your new password.' } });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Your password could not be changed.');
    } finally {
      setChangingPassword(false);
    }
  }

  async function logoutAll() {
    setError(null);
    try {
      await authRequest('/auth/logout-all', { method: 'POST' });
      await signOut();
      navigate('/sign-in', { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Other sessions could not be signed out.');
    }
  }

  async function revokeSession(sessionId: string, current: boolean) {
    try {
      await authRequest('/auth/sessions/' + encodeURIComponent(sessionId), { method: 'DELETE' });
      if (current) {
        await signOut();
        navigate('/sign-in', { replace: true });
        return;
      }
      setSessions((items) => items.filter((session) => session.id !== sessionId));
      setMessage('The selected session was signed out.');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The session could not be signed out.');
    }
  }

  return (
    <section className="page-wrap account-page">
      <p className="eyebrow">YOUR ACCOUNT</p>
      <div className="account-heading">
        <div className="account-identity">
          <span className="account-avatar" aria-hidden="true">{currentUser.fullName.slice(0, 1).toUpperCase()}</span>
          <div>
            <h1>{currentUser.fullName}</h1>
            <p className="muted">Member since {new Date(currentUser.createdAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</p>
          </div>
        </div>
        <button className="button button-outline" type="button" onClick={handleSignOut} disabled={signingOut}>
          <LogOut size={15} />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>

      {message && <Alert tone="success">{message}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <div className="account-tiles">
        <Link className="account-tile" to="/orders">
          <span className="account-tile-icon"><Package size={18} /></span>
          <div><strong>Your orders</strong><span>Track deliveries and review past purchases.</span></div>
        </Link>
        <Link className="account-tile" to={currentUser.roles.includes('SELLER') ? '/seller' : '/sell'}>
          <span className="account-tile-icon"><Store size={18} /></span>
          <div><strong>{currentUser.roles.includes('SELLER') ? 'Seller workspace' : 'Start selling'}</strong><span>Manage products, stock and customer orders.</span></div>
        </Link>
        <Link className="account-tile" to="/help">
          <span className="account-tile-icon"><HelpCircle size={18} /></span>
          <div><strong>Help centre</strong><span>Delivery, payments, returns and seller support.</span></div>
        </Link>
      </div>

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
            <Link className="text-link" to="/orders">Your orders</Link>
            {!currentUser.roles.includes('SELLER') && <Link className="text-link" to="/sell">Apply to become a seller</Link>}
            {currentUser.roles.includes('SELLER') && <Link className="text-link" to="/seller">Open seller workspace</Link>}
            {(currentUser.roles.includes('ADMIN') || currentUser.roles.includes('SUPER_ADMIN')) && (
              <Link className="text-link" to="/admin">Open administration</Link>
            )}
            <Link className="text-link" to="/">Browse the marketplace</Link>
          </div>
        </article>

        <article className="account-card">
          <h2>Profile</h2>
          <form className="auth-form" onSubmit={updateProfile}>
            <FormField label="Full legal name" name="fullName" autoComplete="name" minLength={2} maxLength={160} required value={fullName} onChange={(event) => setFullName(event.target.value)} />
            <button className="button button-primary" type="submit" disabled={savingProfile || fullName.trim().length < 2}>
              {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </article>

        <article className="account-card">
          <h2>Change password</h2>
          <p className="muted">Changing your password signs out all active sessions.</p>
          <form className="auth-form" onSubmit={changePassword}>
            <FormField label="Current password" name="currentPassword" type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            <FormField label="New password" name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            <FormField label="Confirm new password" name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} />
            <button className="button button-primary" type="submit" disabled={changingPassword}>
              {changingPassword ? 'Changing…' : 'Change password'}
            </button>
          </form>
        </article>

        <article className="account-card">
          <div className="account-heading">
            <div><h2>Active sessions</h2><p className="muted">Sign out devices you no longer use.</p></div>
            {sessions.length > 1 && <button className="button button-outline" type="button" onClick={logoutAll}>Sign out all</button>}
          </div>
          {sessions.length === 0 ? <p className="muted">No active sessions found.</p> : (
            <ul className="session-list">
              {sessions.map((session) => (
                <li key={session.id}>
                  <div>
                    <strong>{session.current ? 'This device' : (session.userAgent ?? 'Other device')}</strong>
                    <p className="muted">Signed in {new Date(session.createdAt).toLocaleString()}</p>
                  </div>
                  <button className="text-link" type="button" onClick={() => void revokeSession(session.id, session.current)}>Sign out</button>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
