import { Injectable, Logger } from '@nestjs/common';

import nodemailer, { type Transporter } from 'nodemailer';

import type { ShipmentTrackingNotification } from '../notification.types';

@Injectable()
export class EmailNotificationProvider {
  private readonly logger = new Logger(EmailNotificationProvider.name);

  private readonly transporter: Transporter | null;

  constructor() {
    const host = process.env.SMTP_HOST;

    const port = Number(process.env.SMTP_PORT ?? '587');

    const user = process.env.SMTP_USER;

    const password = process.env.SMTP_PASSWORD;

    if (!host || !user || !password) {
      this.transporter = null;

      this.logger.warn(
        'Email notifications disabled because SMTP configuration is incomplete.',
      );

      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true',

      auth: {
        user,
        pass: password,
      },
    });
  }

  async sendShipmentUpdate(
    notification: ShipmentTrackingNotification,
  ): Promise<boolean> {
    if (!this.transporter || !notification.customerEmail) {
      return false;
    }

    const from = process.env.EMAIL_FROM ?? process.env.SMTP_USER;

    const subject = `EuroAtlas Cargo – Shipment ${notification.shipmentNo}`;

    const text = [
      `Hello ${notification.customerName ?? 'Customer'},`,
      '',
      `Your shipment status has been updated.`,
      `Shipment: ${notification.shipmentNo}`,
      `Status: ${notification.status}`,
      '',
      `Track your shipment:`,
      notification.trackingUrl,
      '',
      'EuroAtlas Cargo',
    ].join('\n');

    await this.transporter.sendMail({
      from,
      to: notification.customerEmail,
      subject,
      text,
    });

    this.logger.log(
      `Tracking email sent for shipment ${notification.shipmentNo}.`,
    );

    return true;
  }
}
