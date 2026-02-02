import { Module, Global } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MailerModule } from '../mailer/mailer.module';

@Global()
@Module({
  imports: [MailerModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
