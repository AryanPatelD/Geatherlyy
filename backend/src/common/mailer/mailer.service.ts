import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailerService.name);

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  async onModuleInit() {
    // Verify transporter connection on startup
    if (this.transporter) {
      try {
        await this.transporter.verify();
        this.logger.log('✅ Mail transporter verified and ready to send emails');
      } catch (error) {
        this.logger.error(`❌ Mail transporter verification failed: ${error.message}`);
      }
    }
  }

  private createTransporter() {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = this.configService.get<number>('MAIL_PORT') || 587;
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    this.logger.log(`Mail config: host=${host}, port=${port}, user=${user}, pass=${pass ? '***' : 'NOT SET'}`);

    if (host && user && pass) {
      // Remove quotes from password if present (common .env issue)
      const cleanPass = pass.replace(/^"|"$/g, '');
      
      // Use Gmail service for better compatibility
      if (host === 'smtp.gmail.com') {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user,
            pass: cleanPass,
          },
        });
        this.logger.log(`Mailer initialized with Gmail service for user: ${user}`);
      } else {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user,
            pass: cleanPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
        this.logger.log(`Mailer initialized with host: ${host}, port: ${port}`);
      }
    } else {
      this.logger.warn(
        'Mailer credentials not found. Emails will be logged to console instead.',
      );
    }
  }

  async sendMail(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
      return;
    }

    try {
      // For Gmail, the from address must match the authenticated user
      const mailUser = this.configService.get<string>('MAIL_USER');
      const mailFrom = this.configService.get<string>('MAIL_FROM');
      
      // Gmail will override the from address with the authenticated email anyway
      // But we can set a display name
      const from = mailFrom || `"Geatherlyy Support" <${mailUser}>`;
      
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      this.logger.log(`✅ Email sent to ${to}, messageId: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${to}: ${error.message}`, error.stack);
      // Don't throw - allow app to continue even if email fails
      return null;
    }
  }
}
