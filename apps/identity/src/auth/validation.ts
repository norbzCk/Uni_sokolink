const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_PATTERN.test(normalizeEmail(email));
}

export function normalizePhone(phone: string): string {
  const compact = phone.trim().replace(/[\s().-]/g, '');
  if (compact.startsWith('00')) {
    return '+' + compact.slice(2);
  }
  if (compact.startsWith('0') && compact.length === 10) {
    return '+255' + compact.slice(1);
  }
  if (compact.startsWith('255') && compact.length === 12) {
    return '+' + compact;
  }
  return compact;
}

export function isValidPhone(phone: string): boolean {
  return PHONE_PATTERN.test(normalizePhone(phone));
}

export interface PasswordContext {
  email: string;
  fullName: string;
}

export function validatePasswordPolicy(password: string, context: PasswordContext): string[] {
  const issues: string[] = [];
  if (password.length < 12) {
    issues.push('Use at least 12 characters.');
  }
  if (password.length > 128) {
    issues.push('Use no more than 128 characters.');
  }
  if (!/[a-z]/.test(password)) {
    issues.push('Include a lowercase letter.');
  }
  if (!/[A-Z]/.test(password)) {
    issues.push('Include an uppercase letter.');
  }
  if (!/\d/.test(password)) {
    issues.push('Include a number.');
  }

  const lowerPassword = password.toLowerCase();
  const normalizedEmail = normalizeEmail(context.email);
  const emailLocalPart = normalizedEmail.split('@')[0] ?? '';
  if (emailLocalPart.length >= 4 && lowerPassword.includes(emailLocalPart)) {
    issues.push('Do not use your email address in the password.');
  }
  const nameParts = context.fullName
    .toLowerCase()
    .split(/\s+/)
    .filter((part) => part.length >= 4);
  if (nameParts.some((part) => lowerPassword.includes(part))) {
    issues.push('Do not use your name in the password.');
  }
  return issues;
}
