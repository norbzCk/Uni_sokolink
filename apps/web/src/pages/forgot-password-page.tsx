import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, apiRequest } from '../api/client';
import { Alert } from '../components/alert';
import { FormField } from '../components/form-field';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await apiRequest<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage(result.message);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The request could not be completed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">PASSWORD RECOVERY</p>
      <h1>Reset your password.</h1>
      <p className="muted">
        Enter the email address on your account. If it matches, we will send a time-limited reset
        link.
      </p>
      <form onSubmit={submit} noValidate>
        {message && <Alert tone="success">{message}</Alert>}
        {error && <Alert tone="error">{error}</Alert>}
        <FormField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button className="button button-primary full-width" type="submit" disabled={pending}>
          {pending ? 'Requesting…' : 'Send reset link'}
        </button>
        <p className="form-foot">
          <Link to="/sign-in">Return to sign in</Link>
        </p>
      </form>
    </section>
  );
}
