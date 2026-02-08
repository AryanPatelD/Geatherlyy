import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Injectable()
export class MailerService implements OnModuleInit {
  private oauth2Client: any = null;
  private gmail: any = null;
  private readonly logger = new Logger(MailerService.name);
  private isReady = false;
  private mailUser: string | undefined;

  constructor(private configService: ConfigService) {
    this.initializeGmailApi();
  }

  async onModuleInit() {
    if (this.gmail) {
      this.logger.log('✅ Gmail API initialized and ready to send emails');
      this.isReady = true;
    }
  }

  private initializeGmailApi() {
    const clientId = this.configService.get<string>('GMAIL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GMAIL_CLIENT_SECRET');
    const refreshToken = this.configService.get<string>('GMAIL_REFRESH_TOKEN');
    this.mailUser = this.configService.get<string>('MAIL_USER');

    this.logger.log(`Gmail API config: clientId=${clientId ? 'SET' : 'NOT SET'}, clientSecret=${clientSecret ? 'SET' : 'NOT SET'}, refreshToken=${refreshToken ? 'SET' : 'NOT SET'}, user=${this.mailUser || 'NOT SET'}`);

    if (clientId && clientSecret && refreshToken && this.mailUser) {
      try {
        this.oauth2Client = new google.auth.OAuth2(
          clientId,
          clientSecret,
          'https://developers.google.com/oauthplayground' // Redirect URI used for getting refresh token
        );

        this.oauth2Client.setCredentials({
          refresh_token: refreshToken,
        });

        this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
        this.logger.log(`Gmail API initialized for user: ${this.mailUser}`);
      } catch (error) {
        this.logger.error(`Failed to initialize Gmail API: ${error.message}`);
      }
    } else {
      this.logger.warn(
        'Gmail API credentials not found. Required: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, MAIL_USER. Emails will be logged to console instead.',
      );
    }
  }

  private createEmailMessage(to: string, subject: string, html: string): string {
    const from = this.configService.get<string>('MAIL_FROM') || `Getherlyy <${this.mailUser}>`;
    
    const emailLines = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      html,
    ];

    const email = emailLines.join('\r\n');
    
    // Encode to base64url format (required by Gmail API)
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return encodedEmail;
  }

  async sendMail(to: string, subject: string, html: string): Promise<any> {
    if (!this.gmail) {
      this.logger.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
      return { mock: true, to, subject };
    }

    try {
      const encodedMessage = this.createEmailMessage(to, subject, html);

      const result = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      this.logger.log(`✅ Email sent to ${to}, messageId: ${result.data.id}`);
      return { messageId: result.data.id, threadId: result.data.threadId };
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${to}: ${error.message}`);
      // Don't throw - allow app to continue even if email fails
      return null;
    }
  }
}
