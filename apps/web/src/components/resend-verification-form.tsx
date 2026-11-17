import { useState, type FormEvent } from 'react';
import { ApiError, apiRequest } from '../api/client';
import { Alert } from './alert';
import { FormField } from './form-field';

interface ResendVerificationFormProps {
  initialEmail?: string;
  onVerified?: () => void;
}

export function ResendVerificationForm({ initialEmail = '', onVerified }: ResendVerificationFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function resend(event: FormEvent<HTMLFormElement>) {
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

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVerifying(true);
    setError(null);
    setMessage(null);
    try {
      await apiRequest<{ verified: true }>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
      setCode('');
      setMessage('Your email address has been verified. You can sign in now.');
      onVerified?.();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not verify this code. Try again.');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="verification-panel">
      {message && <Alert tone="success">{message}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <form className="resend-form" onSubmit={verify}>
        <FormField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <FormField
          label="Verification code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="123456"
          hint="Enter the six digit code from your verification email."
          required
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
        />
        <button className="button button-primary full-width" type="submit" disabled={verifying}>
          {verifying ? 'Verifying…' : 'Verify email'}
        </button>
      </form>

      <form className="resend-form" onSubmit={resend}>
        <button className="button button-outline full-width" type="submit" disabled={sending}>
          {sending ? 'Sending…' : 'Send another verification email'}
        </button>
      </form>
    </div>
  );
}
