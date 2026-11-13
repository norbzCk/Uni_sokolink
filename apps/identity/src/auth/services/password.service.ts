import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { validatePasswordPolicy, type PasswordContext } from '../validation';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
};

const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$DMZSclkcCKOkcU5QVbjcpw$EkKolUonbQNCNFiXjh7+mxv5nbblyyL8ACAJtDy6ykk';

@Injectable()
export class PasswordService {
  async verifyDummy(password: string): Promise<void> {
    await this.verify(DUMMY_PASSWORD_HASH, password);
  }

  async hash(password: string): Promise<string> {
    return argon2.hash(password, ARGON2_OPTIONS);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  validate(password: string, context: PasswordContext): string[] {
    return validatePasswordPolicy(password, context);
  }
}
