import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert } from '../components/alert';
import { ResendVerificationForm } from '../components/resend-verification-form';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [verified, setVerified] = useState(false);
  const email = searchParams.get('email') ?? '';

  if (verified) {
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
      <h1>Verify your email address</h1>
      <p className="muted">
        Enter the six digit code from your verification email. You can request another code if it
        has expired.
      </p>
      <ResendVerificationForm initialEmail={email} onVerified={() => setVerified(true)} />
      <p className="form-foot">
        <Link to="/sign-in">Return to sign in</Link>
      </p>
    </section>
  );
}
