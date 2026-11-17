import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/auth-context';
import { Alert } from '../components/alert';
import { FormField } from '../components/form-field';
import { ResendVerificationForm } from '../components/resend-verification-form';

interface RegistrationView {
  email: string;
  verificationEmailSent: boolean;
  phoneVerificationSent: boolean;
}

export function SignUpPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [customerCategory, setCustomerCategory] = useState<'STUDENT' | 'STAFF'>('STUDENT');
  const [institution, setInstitution] = useState('IFM');
  const [studentRegistrationNumber, setStudentRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [registered, setRegistered] = useState<RegistrationView | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors([]);

    if (password !== passwordConfirmation) {
      setError('The passwords do not match.');
      return;
    }

    setPending(true);
    try {
      const result = await register({
        fullName,
        email,
        phone,
        customerCategory,
        institution: institution.trim(),
        ...(customerCategory === 'STUDENT'
          ? { studentRegistrationNumber: studentRegistrationNumber.trim() }
          : {}),
        password,
        passwordConfirmation,
      });
      setRegistered({
        email: result.email,
        verificationEmailSent: result.verificationEmailSent,
        phoneVerificationSent: result.phoneVerificationSent,
      });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFieldErrors(caught.fieldErrors ?? []);
      } else {
        setError('Registration could not be completed. Try again.');
      }
    } finally {
      setPending(false);
    }
  }

  if (registered) {
    return (
      <section className="auth-card">
        <p className="eyebrow">ACCOUNT CREATED</p>
        <h1>Check your email.</h1>
        <p className="muted">
          We sent a six digit verification code to <strong>{registered.email}</strong>. Enter it
          below to verify your address before signing in.
        </p>
        {!registered.verificationEmailSent && (
          <Alert tone="error">
            The verification email could not be sent immediately. Request another one below.
          </Alert>
        )}
        {registered.phoneVerificationSent && (
          <Alert tone="info">
            A phone verification code was also sent. You can confirm it from your account after
            signing in.
          </Alert>
        )}
        <ResendVerificationForm
          initialEmail={registered.email}
          onVerified={() => navigate('/sign-in', { replace: true })}
        />
        <p className="form-foot">
          Already verified? <Link to="/sign-in">Sign in</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">CREATE YOUR ACCOUNT</p>
      <h1>Start with a customer account.</h1>
      <p className="muted">
        Students and university staff can shop. IFM students can apply to sell later, after an
        administrator reviews their evidence.
      </p>
      <form onSubmit={submit} noValidate>
        {error && (
          <Alert tone="error">
            <span>{error}</span>
            {fieldErrors.length > 0 && (
              <ul className="alert-list">
                {fieldErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
          </Alert>
        )}
        <FormField
          label="Full name"
          name="fullName"
          autoComplete="name"
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
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
          label="Phone number"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          hint="Use a number you can receive calls or messages on. Example: +255 7xx xxx xxx"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <label className="field">
          <span>Account type</span>
          <select
            name="customerCategory"
            value={customerCategory}
            onChange={(event) => {
              const next = event.target.value as 'STUDENT' | 'STAFF';
              setCustomerCategory(next);
              setInstitution(next === 'STUDENT' ? 'IFM' : '');
              setStudentRegistrationNumber('');
            }}
            required
          >
            <option value="STUDENT">Student</option>
            <option value="STAFF">University staff</option>
          </select>
          <small className="field-hint">Students and university staff can shop on SokoLink.</small>
        </label>
        <FormField
          label={customerCategory === 'STUDENT' ? 'Institution' : 'University or department'}
          name="institution"
          minLength={2}
          maxLength={160}
          required
          value={institution}
          onChange={(event) => setInstitution(event.target.value)}
        />
        {customerCategory === 'STUDENT' && (
          <FormField
            label="Student registration number"
            name="studentRegistrationNumber"
            minLength={3}
            maxLength={64}
            required
            hint="Used to verify IFM student seller applications."
            value={studentRegistrationNumber}
            onChange={(event) => setStudentRegistrationNumber(event.target.value)}
          />
        )}
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 12 characters with upper and lower case letters and a number."
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <FormField
          label="Confirm password"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          required
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
        />
        <button className="button button-primary full-width" type="submit" disabled={pending}>
          {pending ? 'Creating account…' : 'Create account'}
        </button>
        <p className="form-foot">
          Already have an account? <Link to="/sign-in">Sign in</Link>
        </p>
      </form>
    </section>
  );
}
