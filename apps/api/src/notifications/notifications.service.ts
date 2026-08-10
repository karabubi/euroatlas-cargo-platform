import { Injectable, Logger } from '@nestjs/common';

import { EmailNotificationProvider } from './providers/email.provider';

import { WhatsAppNotificationProvider } from './providers/whatsapp.provider';

import type { ShipmentTrackingNotification } from './notification.types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly email: EmailNotificationProvider,

    private readonly whatsapp: WhatsAppNotificationProvider,
  ) {}

  async sendShipmentTrackingUpdate(
    notification: ShipmentTrackingNotification,
  ): Promise<void> {
    const results = await Promise.allSettled([
      this.email.sendShipmentUpdate(notification),

      this.whatsapp.sendShipmentUpdate(notification),
    ]);

    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.error(result.reason);
      }
    }
  }
}
