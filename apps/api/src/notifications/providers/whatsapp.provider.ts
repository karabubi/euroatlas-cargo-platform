import { Injectable, Logger } from '@nestjs/common';

import type { ShipmentTrackingNotification } from '../notification.types';

@Injectable()
export class WhatsAppNotificationProvider {
  private readonly logger = new Logger(WhatsAppNotificationProvider.name);

  private readonly shippingMilestones = [
    {
      status: 'BOOKED',
      label: 'Booked',
    },
    {
      status: 'RECEIVED',
      label: 'Received',
    },
    {
      status: 'LOADED',
      label: 'Loaded',
    },
    {
      status: 'IN_TRANSIT',
      label: 'In Transit',
    },
    {
      status: 'ARRIVED',
      label: 'Arrived',
    },
    {
      status: 'CUSTOMS_CLEARANCE',
      label: 'Customs Clearance',
    },
    {
      status: 'READY_FOR_DELIVERY',
      label: 'Ready for Delivery',
    },
    {
      status: 'DELIVERED',
      label: 'Delivered',
    },
  ] as const;

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
      this.logger.warn(
        'WhatsApp notification skipped because configuration or customer phone is missing.',
      );

      return false;
    }

    const endpoint = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    const milestoneSummary = this.buildMilestonesText(notification.status);

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
                  text: this.formatStatus(notification.status),
                },
                {
                  type: 'text',
                  text: notification.trackingUrl,
                },
                {
                  type: 'text',
                  text: milestoneSummary,
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

  private buildMilestonesText(currentStatus: string): string {
    if (currentStatus === 'CANCELLED') {
      return '✕ Shipment Cancelled';
    }

    const currentIndex = this.shippingMilestones.findIndex(
      (milestone) => milestone.status === currentStatus,
    );

    if (currentIndex < 0) {
      return this.formatStatus(currentStatus);
    }

    return this.shippingMilestones
      .map((milestone, index) => {
        const symbol =
          index < currentIndex ? '✓' : index === currentIndex ? '●' : '○';

        return `${symbol} ${milestone.label}`;
      })
      .join('\n');
  }

  private formatStatus(status: string): string {
    return status
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private normalizePhone(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/\D/g, '');

    return normalized.length >= 8 ? normalized : null;
  }
}
