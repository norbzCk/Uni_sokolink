import { Inject, Injectable, Logger } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { IdentityEnvironment } from '../../environment';
import { IDENTITY_ENVIRONMENT } from '../../environment.provider';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @Inject(IDENTITY_ENVIRONMENT) private readonly environment: IdentityEnvironment,
  ) {
    if (
      environment.NODE_ENV === 'production' &&
      environment.SMS_PROVIDER === 'development-file'
    ) {
      throw new Error('The development-file SMS adapter cannot be used in production.');
    }
  }

  async sendVerificationCode(phone: string, code: string): Promise<void> {
    const provider =
      this.environment.SMS_PROVIDER ??
      (this.environment.NODE_ENV !== 'production' ? 'development-file' : undefined);

    if (provider === 'development-file') {
      await mkdir(this.environment.SMS_OUTBOX_DIR, { recursive: true });
      const file = join(
        this.environment.SMS_OUTBOX_DIR,
        Date.now() + '-' + randomUUID() + '.txt',
      );
      await writeFile(
        file,
        'To: ' + phone + '\nSokoLink verification code: ' + code + '\nExpires in ' +
          this.environment.PHONE_VERIFICATION_TTL_MINUTES + ' minutes.\n',
        { mode: 0o600 },
      );
      this.logger.log(
        { phone: this.maskPhone(phone), file },
        'development SMS verification code written to local outbox',
      );
      return;
    }

    throw new Error(
      'No approved SMS provider is configured. Phone verification cannot be delivered.',
    );
  }

  private maskPhone(phone: string): string {
    return phone.length <= 4 ? '****' : '****' + phone.slice(-4);
  }
}
