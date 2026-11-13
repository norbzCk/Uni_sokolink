import { Module } from '@nestjs/common';
import { identityEnvironmentProvider } from '../environment.provider';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuditService } from './services/audit.service';
import { MailerService } from './services/mailer.service';
import { PasswordService } from './services/password.service';
import { RateLimitService } from './services/rate-limit.service';
import { SessionService } from './services/session.service';
import { SmsService } from './services/sms.service';
import { TokenService } from './services/token.service';
import { VerificationService } from './services/verification.service';

@Module({
  controllers: [AuthController],
  providers: [
    identityEnvironmentProvider,
    AuthService,
    AuditService,
    MailerService,
    PasswordService,
    RateLimitService,
    SessionService,
    SmsService,
    TokenService,
    VerificationService,
  ],
  exports: [TokenService],
})
export class AuthModule {}
