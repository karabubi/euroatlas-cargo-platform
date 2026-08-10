import { Injectable, Logger } from '@nestjs/common';

import type { ShipmentTrackingNotification } from '../notification.types';

@Injectable()
export class WhatsAppNotificationProvider {
  private readonly logger = new Logger(WhatsAppNotificationProvider.name);

  async sendShipmentUpdate(
    notification: ShipmentTrackingNotification,
  ): Promise<boolean> {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    const apiVersion = process.env.WHATSAPP_API_VERSION;

    const templateName = process.env.WHATSAPP_TRACKING_TEMPLATE;

    const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? 'en';

    const recipient = this.normalizePhone(notification.customerPhone);

    if (
      !token ||
      !phoneNumberId ||
      !apiVersion ||
      !templateName ||
      !recipient
    ) {
      return false;
    }

    const endpoint = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    const response = await fetch(endpoint, {
      method: 'POST',

      headers: {
        Authorization: `Bearer ${token}`,

        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        messaging_product: 'whatsapp',

        to: recipient,

        type: 'template',

        template: {
          name: templateName,

          language: {
            code: languageCode,
          },

          components: [
            {
              type: 'body',

              parameters: [
                {
                  type: 'text',
                  text: notification.shipmentNo,
                },
                {
                  type: 'text',
                  text: notification.status,
                },
                {
                  type: 'text',
                  text: notification.trackingUrl,
                },
              ],
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();

      this.logger.error(
        `WhatsApp notification failed (${response.status}): ${body}`,
      );

      return false;
    }

    this.logger.log(
      `WhatsApp tracking message sent for shipment ${notification.shipmentNo}.`,
    );

    return true;
  }

  private normalizePhone(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/\D/g, '');

    return normalized.length >= 8 ? normalized : null;
  }
}
