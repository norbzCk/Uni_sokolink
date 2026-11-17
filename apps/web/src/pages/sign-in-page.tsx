import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth, type User } from '../auth/auth-context';
import { Alert } from '../components/alert';
import { FormField } from '../components/form-field';
import { ResendVerificationForm } from '../components/resend-verification-form';

function landingPath(user: User): string {
  if (user.roles.includes('SUPER_ADMIN') || user.roles.includes('ADMIN')) {
    return '/admin';
  }
  if (user.roles.includes('SELLER')) {
    return '/seller';
  }
  return '/account';
}

export function SignInPage() {
  const { signIn, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const from = (location.state as { from?: string } | null)?.from;

  if (status === 'authenticated') {
    return <Navigate to={from ?? '/account'} replace />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrorCode(null);
    setPending(true);
    try {
      const user = await signIn(identifier, password);
      navigate(from ?? landingPath(user), { replace: true });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setErrorCode(caught.code ?? null);
      } else {
        setError('Sign in could not be completed. Try again.');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">WELCOME BACK</p>
      <h1>Sign in to continue</h1>
      <p className="muted">Your marketplace and business workspace, in one place.</p>
      <form onSubmit={submit} noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <FormField
          label="Email address or phone number"
          name="identifier"
          autoComplete="username"
          required
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button className="button button-primary full-width" type="submit" disabled={pending}>
          {pending ? 'Signing in…' : 'Continue'}
        </button>
        <p className="form-foot">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
        <p className="form-foot">
          New to SokoLink? <Link to="/sign-up">Create an account</Link>
        </p>
      </form>
      {errorCode === 'EMAIL_NOT_VERIFIED' && (
        <ResendVerificationForm
          initialEmail={identifier.includes('@') ? identifier : ''}
          onVerified={() => {
            setError(null);
            setErrorCode(null);
          }}
        />
      )}
    </section>
  );
}
