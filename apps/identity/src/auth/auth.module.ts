import { Module } from '@nestjs/common';
import { identityEnvironmentProvider } from '../environment.provider';
import { AuthController } from './auth.controller';
import { UsersController } from './users.controller';
import { AuthService } from './auth.service';
import { AuditService } from './services/audit.service';
import { MailerService } from './services/mailer.service';
import { PasswordService } from './services/password.service';
import { RateLimitService } from './services/rate-limit.service';
import { SessionService } from './services/session.service';
import { SmsService } from './services/sms.service';
import { TokenService } from './services/token.service';
import { VerificationService } from './services/verification.service';
import { OutboxPublisherService } from './services/outbox-publisher.service';

@Module({
  controllers: [AuthController, UsersController],
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
    OutboxPublisherService,
  ],
  exports: [TokenService],
})
export class AuthModule {}
