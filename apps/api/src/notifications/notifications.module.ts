import { Module } from '@nestjs/common';

import { NotificationsService } from './notifications.service';

import { EmailNotificationProvider } from './providers/email.provider';

import { WhatsAppNotificationProvider } from './providers/whatsapp.provider';

@Module({
  providers: [
    NotificationsService,
    EmailNotificationProvider,
    WhatsAppNotificationProvider,
  ],

  exports: [NotificationsService],
})
export class NotificationsModule {}
