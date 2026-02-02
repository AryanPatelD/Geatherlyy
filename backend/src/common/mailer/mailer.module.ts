import { Module, Global } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { NotificationService } from './notification.service';

@Global()
@Module({
  providers: [MailerService, NotificationService],
  exports: [MailerService, NotificationService],
})
export class MailerModule {}
