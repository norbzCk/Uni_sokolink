import { describe, expect, it } from 'vitest';
import {
  isValidEmail,
  isValidPhone,
  normalizeEmail,
  normalizePhone,
  validatePasswordPolicy,
} from './validation';

describe('identity input validation', () => {
  it('normalizes email addresses for lookup', () => {
    expect(normalizeEmail('  Student@Example.COM ')).toBe('student@example.com');
    expect(isValidEmail('student@example.com')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
  });

  it('normalizes Tanzanian and international phone formats', () => {
    expect(normalizePhone('0712 345 678')).toBe('+255712345678');
    expect(normalizePhone('+255 712 345 678')).toBe('+255712345678');
    expect(normalizePhone('255712345678')).toBe('+255712345678');
    expect(normalizePhone('0044 7700 900123')).toBe('+447700900123');
    expect(isValidPhone('0712345678')).toBe(true);
    expect(isValidPhone('123')).toBe(false);
  });

  it('rejects weak passwords and personal information', () => {
    expect(validatePasswordPolicy('short', { email: 'a@b.com', fullName: 'A B' })).not.toHaveLength(0);
    expect(
      validatePasswordPolicy('validpassword1A', { email: 'student@example.com', fullName: 'Amina Hassan' }),
    ).toEqual([]);
    expect(
      validatePasswordPolicy('AminaPassword123', { email: 'student@example.com', fullName: 'Amina Hassan' }),
    ).toContain('Do not use your name in the password.');
    expect(
      validatePasswordPolicy('studentPassword123', {
        email: 'student@example.com',
        fullName: 'Amina Hassan',
      }),
    ).toContain('Do not use your email address in the password.');
  });
});
