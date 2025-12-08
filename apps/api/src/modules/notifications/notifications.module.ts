import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { PushNotificationService } from './push.service';
import { NotificationsController } from './notifications.controller';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [NotificationsController],
  providers: [EmailService, PushNotificationService],
  exports: [EmailService, PushNotificationService],
})
export class NotificationsModule {}
