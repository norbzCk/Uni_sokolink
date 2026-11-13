import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError, apiRequest } from '../api/client';
import { Alert } from '../components/alert';
import { FormField } from '../components/form-field';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors([]);
    if (!token) {
      setError('This password reset link is missing its token.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('The passwords do not match.');
      return;
    }
    setPending(true);
    try {
      await apiRequest<{ reset: true }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password, passwordConfirmation }),
      });
      setComplete(true);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFieldErrors(caught.fieldErrors ?? []);
      } else {
        setError('The password could not be reset.');
      }
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <section className="auth-card">
        <p className="eyebrow">PASSWORD RECOVERY</p>
        <h1>This link is incomplete.</h1>
        <Alert tone="error">This password reset link is missing its token.</Alert>
        <p className="form-foot"><Link to="/forgot-password">Request a new reset link</Link></p>
      </section>
    );
  }

  if (complete) {
    return (
      <section className="auth-card">
        <p className="eyebrow">PASSWORD UPDATED</p>
        <h1>Your password has been reset.</h1>
        <Alert tone="success">All other sessions were signed out for security.</Alert>
        <Link className="button button-primary full-width" to="/sign-in">Sign in</Link>
      </section>
    );
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">PASSWORD RECOVERY</p>
      <h1>Choose a new password.</h1>
      <form onSubmit={submit} noValidate>
        {error && (
          <Alert tone="error">
            <span>{error}</span>
            {fieldErrors.length > 0 && (
              <ul className="alert-list">
                {fieldErrors.map((message) => <li key={message}>{message}</li>)}
              </ul>
            )}
          </Alert>
        )}
        <FormField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 12 characters with upper and lower case letters and a number."
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <FormField
          label="Confirm new password"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          required
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
        />
        <button className="button button-primary full-width" type="submit" disabled={pending}>
          {pending ? 'Updating…' : 'Reset password'}
        </button>
      </form>
    </section>
  );
}
