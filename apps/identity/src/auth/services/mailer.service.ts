import { Inject, Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { IdentityEnvironment } from '../../environment';
import { IDENTITY_ENVIRONMENT } from '../../environment.provider';

interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatExpiry(date: Date): string {
  return date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter: Transporter | null;

  constructor(
    @Inject(IDENTITY_ENVIRONMENT) private readonly environment: IdentityEnvironment,
  ) {
    if (environment.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: environment.SMTP_HOST,
        port: environment.SMTP_PORT,
        secure: environment.SMTP_SECURE,
        ...(environment.SMTP_USER
          ? {
              auth: {
                user: environment.SMTP_USER,
                pass: environment.SMTP_PASSWORD ?? '',
              },
            }
          : {}),
      });
    } else {
      this.transporter = null;
      if (environment.NODE_ENV === 'production') {
        throw new Error('SMTP_HOST is required in production.');
      }
      this.logger.warn(
        { outbox: environment.MAIL_OUTBOX_DIR },
        'SMTP is not configured; verification email will be written to the local development outbox',
      );
    }
  }

  async sendEmailVerification(
    to: string,
    fullName: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    const link = this.environment.WEB_APP_URL + '/verify-email?token=' + encodeURIComponent(token);
    await this.send({
      to,
      subject: 'Verify your SokoLink email address',
      text:
        'Hello ' +
        fullName +
        ',\n\nVerify your SokoLink email address by opening this link:\n' +
        link +
        '\n\nThis link expires on ' +
        formatExpiry(expiresAt) +
        '. If you did not create a SokoLink account, ignore this message.\n',
      html:
        '<p>Hello ' +
        escapeHtml(fullName) +
        ',</p><p>Verify your SokoLink email address by opening the link below.</p>' +
        '<p><a href="' +
        escapeHtml(link) +
        '">Verify email address</a></p>' +
        '<p>This link expires on ' +
        escapeHtml(formatExpiry(expiresAt)) +
        '. If you did not create a SokoLink account, ignore this message.</p>',
    });
  }

  async sendPasswordReset(
    to: string,
    fullName: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    const link = this.environment.WEB_APP_URL + '/reset-password?token=' + encodeURIComponent(token);
    await this.send({
      to,
      subject: 'Reset your SokoLink password',
      text:
        'Hello ' +
        fullName +
        ',\n\nReset your SokoLink password by opening this link:\n' +
        link +
        '\n\nThis link expires on ' +
        formatExpiry(expiresAt) +
        '. If you did not request a password reset, ignore this message and your password will stay unchanged.\n',
      html:
        '<p>Hello ' +
        escapeHtml(fullName) +
        ',</p><p>Reset your SokoLink password by opening the link below.</p>' +
        '<p><a href="' +
        escapeHtml(link) +
        '">Reset password</a></p>' +
        '<p>This link expires on ' +
        escapeHtml(formatExpiry(expiresAt)) +
        '. If you did not request a password reset, ignore this message and your password will stay unchanged.</p>',
    });
  }

  private async send(message: MailMessage): Promise<void> {
    if (this.transporter) {
      await this.transporter.sendMail({
        from: this.environment.SMTP_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      return;
    }

    if (this.environment.NODE_ENV === 'production') {
      throw new Error('Email delivery is not configured.');
    }

    await mkdir(this.environment.MAIL_OUTBOX_DIR, { recursive: true });
    const file = join(
      this.environment.MAIL_OUTBOX_DIR,
      Date.now() + '-' + randomUUID() + '.eml',
    );
    const contents = [
      'To: ' + message.to,
      'From: ' + this.environment.SMTP_FROM,
      'Subject: ' + message.subject,
      'Content-Type: text/html; charset=utf-8',
      '',
      message.html,
      '',
    ].join('\n');
    await writeFile(file, contents, { mode: 0o600 });
    this.logger.log(
      { recipient: message.to, file },
      'development email written to local outbox',
    );
  }
}
