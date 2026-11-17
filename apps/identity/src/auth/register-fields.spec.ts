import { describe, expect, it } from 'vitest';
import { validateSync } from 'class-validator';
import { RegisterDto } from './dto/register.dto';

const base = {
  fullName: 'Amina Hassan',
  email: 'amina@example.com',
  phone: '+255712345678',
  customerCategory: 'STUDENT',
  institution: 'IFM',
  studentRegistrationNumber: '2024/12345',
  password: 'ValidPassword123',
  passwordConfirmation: 'ValidPassword123',
} as const;

function fieldErrors(overrides: Record<string, unknown> = {}): string[] {
  const dto = Object.assign(new RegisterDto(), { ...base, ...overrides });
  return validateSync(dto).flatMap((error) => Object.keys(error.constraints ?? {}));
}

describe('registration business fields', () => {
  it('accepts an IFM student with a registration number', () => {
    expect(fieldErrors()).toEqual([]);
  });

  it('requires a registration number for students', () => {
    expect(fieldErrors({ studentRegistrationNumber: '' })).toContain('minLength');
  });

  it('accepts staff without a student registration number', () => {
    expect(fieldErrors({ customerCategory: 'STAFF', institution: 'IFM', studentRegistrationNumber: undefined })).toEqual([]);
  });

  it('requires a supported customer category', () => {
    expect(fieldErrors({ customerCategory: 'VENDOR' })).toContain('isIn');
  });
});
