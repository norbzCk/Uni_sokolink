import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError, apiRequest } from '../api/client';
import { Alert } from '../components/alert';
import { ResendVerificationForm } from '../components/resend-verification-form';

type VerifyState = 'checking' | 'verified' | 'error';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<VerifyState>(token ? 'checking' : 'error');
  const [error, setError] = useState<string | null>(
    token ? null : 'This verification link is missing its token.',
  );
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) {
      return;
    }
    started.current = true;
    apiRequest<{ verified: true }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(() => setState('verified'))
      .catch((caught: unknown) => {
        setError(caught instanceof ApiError ? caught.message : 'This verification link could not be used.');
        setState('error');
      });
  }, [token]);

  if (state === 'checking') {
    return (
      <section className="auth-card">
        <p className="eyebrow">EMAIL VERIFICATION</p>
        <h1>Verifying your email…</h1>
        <p className="muted" role="status">This only takes a moment.</p>
      </section>
    );
  }

  if (state === 'verified') {
    return (
      <section className="auth-card">
        <p className="eyebrow">EMAIL VERIFIED</p>
        <h1>Your account is ready.</h1>
        <Alert tone="success">Your email address has been verified.</Alert>
        <p className="muted">Sign in to open your SokoLink account.</p>
        <Link className="button button-primary full-width" to="/sign-in">Sign in</Link>
      </section>
    );
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">EMAIL VERIFICATION</p>
      <h1>We could not verify this link.</h1>
      {error && <Alert tone="error">{error}</Alert>}
      <p className="muted">Request a new verification email below.</p>
      <ResendVerificationForm />
      <p className="form-foot">
        <Link to="/sign-in">Return to sign in</Link>
      </p>
    </section>
  );
}
