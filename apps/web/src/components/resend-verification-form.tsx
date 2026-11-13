import { useState, type FormEvent } from 'react';
import { ApiError, apiRequest } from '../api/client';
import { Alert } from './alert';
import { FormField } from './form-field';

interface ResendVerificationFormProps {
  initialEmail?: string;
}

export function ResendVerificationForm({ initialEmail = '' }: ResendVerificationFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await apiRequest<{ message: string }>('/auth/resend-email-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage(result.message);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not request another verification email.');
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="resend-form" onSubmit={submit}>
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
      <button className="button button-outline" type="submit" disabled={sending}>
        {sending ? 'Sending…' : 'Send another verification email'}
      </button>
    </form>
  );
}
