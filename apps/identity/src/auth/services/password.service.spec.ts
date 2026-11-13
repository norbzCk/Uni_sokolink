import { describe, expect, it } from 'vitest';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const passwords = new PasswordService();

  it('hashes with Argon2id and verifies the correct password', async () => {
    const hash = await passwords.hash('CorrectHorseBattery9');
    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(passwords.verify(hash, 'CorrectHorseBattery9')).resolves.toBe(true);
    await expect(passwords.verify(hash, 'WrongHorseBattery9')).resolves.toBe(false);
  });

  it('treats malformed hashes as invalid instead of throwing', async () => {
    await expect(passwords.verify('not-a-hash', 'anything')).resolves.toBe(false);
  });
});
