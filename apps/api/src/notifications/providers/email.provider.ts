import { Injectable, Logger } from '@nestjs/common';

import { createTransport, type Transporter } from 'nodemailer';

import type { ShipmentTrackingNotification } from '../notification.types';

@Injectable()
export class EmailNotificationProvider {
  private readonly shippingMilestones = [
    {
      status: 'DRAFT',
      label: 'Draft',
    },
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

  private readonly logger = new Logger(EmailNotificationProvider.name);

  private readonly transporter: Transporter | null;

  constructor() {
    const host = process.env.SMTP_HOST?.trim();
    const portValue = process.env.SMTP_PORT?.trim();
    const user = process.env.SMTP_USER?.trim();
    const password = process.env.SMTP_PASSWORD?.trim();

    const port = Number(portValue);

    if (
      !host ||
      !portValue ||
      !Number.isInteger(port) ||
      port <= 0 ||
      port > 65535 ||
      !user ||
      !password
    ) {
      this.transporter = null;

      this.logger.warn(
        'Email notifications disabled because SMTP configuration is incomplete.',
      );

      return;
    }

    const secure =
      process.env.SMTP_SECURE?.trim().toLowerCase() === 'true' || port === 465;

    this.transporter = createTransport({
      host,
      port,
      secure,
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

    const from = process.env.EMAIL_FROM?.trim();

    if (!from) {
      this.logger.error(
        'Tracking email cannot be sent because EMAIL_FROM is missing.',
      );

      return false;
    }

    const customerName = notification.customerName ?? 'Customer';

    const status = this.formatStatus(notification.status);

    const subject = `EuroAtlas Cargo – Tracking sent – ${notification.shipmentNo}`;

    const text = [
      `Hello ${customerName},`,
      '',
      'Your shipment status has been updated.',
      '',
      `Shipment: ${notification.shipmentNo}`,
      `Status: ${status}`,
      '',
      this.buildMilestonesText(notification.status),
      '',
      'Track your shipment:',
      notification.trackingUrl,
      '',
      'EuroAtlas Cargo',
    ].join('\n');

    const html = this.buildShipmentHtml({
      customerName,
      shipmentNo: notification.shipmentNo,
      status,
      rawStatus: notification.status,
      trackingUrl: notification.trackingUrl,
    });

    try {
      await this.transporter.sendMail({
        from,
        to: [notification.customerEmail],
        subject,
        text,
        html,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown SMTP error.';

      this.logger.error(
        `Tracking email failed for shipment ${notification.shipmentNo}: ${errorMessage}`,
      );

      return false;
    }

    this.logger.log(
      `Tracking email sent for shipment ${notification.shipmentNo}.`,
    );

    await this.sendAdminConfirmation(notification, from);

    return true;
  }

  private async sendAdminConfirmation(
    notification: ShipmentTrackingNotification,
    from: string | undefined,
  ): Promise<void> {
    if (!this.transporter) {
      return;
    }

    if (!from) {
      this.logger.error(
        'Admin confirmation cannot be sent because the sender address is missing.',
      );

      return;
    }

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();

    if (!adminEmail) {
      this.logger.warn(
        'Admin confirmation email disabled because ADMIN_NOTIFICATION_EMAIL is missing.',
      );

      return;
    }

    const customerEmail =
      notification.customerEmail?.trim() || 'No customer email';

    const customerName = notification.customerName?.trim() || 'Customer';

    const status = this.formatStatus(notification.status);

    const subject = `EuroAtlas Cargo – Tracking sent – ${notification.shipmentNo}`;

    const text = [
      'EuroAtlas Cargo tracking notification confirmation',
      '',
      'The customer tracking email was sent successfully.',
      '',
      `Shipment: ${notification.shipmentNo}`,
      `Status: ${status}`,
      `Customer: ${customerName}`,
      `Customer email: ${customerEmail}`,
      '',
      this.buildMilestonesText(notification.status),
      '',
      `Tracking URL: ${notification.trackingUrl}`,
      '',
      'EuroAtlas Cargo Administration',
    ].join('\n');

    const html = `
<!doctype html>
<html lang="en">
  <body
    style="
      margin:0;
      padding:24px;
      background:#f1f5f9;
      font-family:Arial,Helvetica,sans-serif;
      color:#0f172a;
    "
  >
    <div
      style="
        max-width:620px;
        margin:0 auto;
        background:#ffffff;
        border-radius:16px;
        padding:30px;
        border:1px solid #e2e8f0;
      "
    >
      <div
        style="
          font-size:13px;
          font-weight:700;
          letter-spacing:2px;
          color:#0284c7;
        "
      >
        EUROATLAS CARGO
      </div>

      <h1
        style="
          margin:12px 0 20px;
          font-size:25px;
        "
      >
        Tracking email sent successfully
      </h1>

      <p
        style="
          color:#475569;
          line-height:1.6;
        "
      >
        A shipment tracking notification was successfully sent
        to the customer.
      </p>

      <table
        width="100%"
        cellpadding="8"
        cellspacing="0"
        style="
          margin-top:20px;
          border-collapse:collapse;
        "
      >
        <tr>
          <td><strong>Shipment</strong></td>
          <td>${this.escapeHtml(notification.shipmentNo)}</td>
        </tr>

        <tr>
          <td><strong>Status</strong></td>
          <td>${this.escapeHtml(status)}</td>
        </tr>

        <tr>
          <td><strong>Customer</strong></td>
          <td>${this.escapeHtml(customerName)}</td>
        </tr>

        <tr>
          <td><strong>Customer email</strong></td>
          <td>${this.escapeHtml(customerEmail)}</td>
        </tr>
      </table>

      ${this.buildMilestonesHtml(notification.status)}

      <div
        style="
          margin-top:26px;
          text-align:center;
        "
      >
        <a
          href="${this.escapeHtml(notification.trackingUrl)}"
          style="
            display:inline-block;
            background:#0f172a;
            color:#ffffff;
            text-decoration:none;
            font-weight:700;
            padding:14px 24px;
            border-radius:10px;
          "
        >
          Open Tracking Page
        </a>
      </div>
    </div>
  </body>
</html>
`;

    try {
      await this.transporter.sendMail({
        from,
        to: [adminEmail],
        subject,
        text,
        html,
      });

      this.logger.log(
        `Admin tracking confirmation sent for shipment ${notification.shipmentNo}.`,
      );
    } catch (error) {
      this.logger.error(
        `Customer email was sent, but admin confirmation failed for shipment ${notification.shipmentNo}.`,
      );

      if (error instanceof Error) {
        this.logger.error(error.message);
      }
    }
  }

  private getMilestoneIndex(currentStatus: string): number {
    return this.shippingMilestones.findIndex(
      (milestone) => milestone.status === currentStatus,
    );
  }

  private buildMilestonesText(currentStatus: string): string {
    if (currentStatus === 'CANCELLED') {
      return ['SHIPPING MILESTONES', '', '✕ Shipment Cancelled'].join('\n');
    }

    const currentIndex = this.getMilestoneIndex(currentStatus);

    return [
      'SHIPPING MILESTONES',
      '',
      ...this.shippingMilestones.map((milestone, index) => {
        const delivered = currentStatus === 'DELIVERED';

        const symbol =
          delivered || index < currentIndex
            ? '✓'
            : index === currentIndex
              ? '●'
              : '○';

        return `${symbol} ${milestone.label}`;
      }),
    ].join('\n');
  }

  private buildMilestonesHtml(currentStatus: string): string {
    if (currentStatus === 'CANCELLED') {
      return `
        <div
          style="
            margin-top:28px;
            border:1px solid #fecaca;
            background:#fef2f2;
            border-radius:14px;
            padding:20px;
          "
        >
          <div
            style="
              color:#991b1b;
              font-size:14px;
              font-weight:700;
            "
          >
            SHIPPING MILESTONES
          </div>

          <div
            style="
              margin-top:14px;
              color:#b91c1c;
              font-size:16px;
              font-weight:700;
            "
          >
            ✕ Shipment Cancelled
          </div>
        </div>
      `;
    }

    const currentIndex = this.getMilestoneIndex(currentStatus);

    const rows = this.shippingMilestones
      .map((milestone, index) => {
        const delivered = currentStatus === 'DELIVERED';

        const completed = delivered || index < currentIndex;

        const current = !delivered && index === currentIndex;

        const marker = completed ? '✓' : current ? '●' : '○';

        const markerColor = completed
          ? '#16a34a'
          : current
            ? '#0284c7'
            : '#94a3b8';

        const textColor = completed || current ? '#0f172a' : '#94a3b8';

        const fontWeight = current ? '700' : '600';

        return `
              <tr>
                <td
                  width="42"
                  valign="top"
                  style="
                    padding:8px 0;
                    color:${markerColor};
                    font-size:20px;
                    font-weight:700;
                  "
                >
                  ${marker}
                </td>

                <td
                  style="
                    padding:8px 0;
                    color:${textColor};
                    font-size:15px;
                    font-weight:${fontWeight};
                  "
                >
                  ${this.escapeHtml(milestone.label)}
                </td>
              </tr>
            `;
      })
      .join('');

    return `
      <div
        style="
          margin-top:28px;
          border:1px solid #e2e8f0;
          background:#f8fafc;
          border-radius:14px;
          padding:20px;
        "
      >
        <div
          style="
            color:#64748b;
            font-size:12px;
            font-weight:700;
            letter-spacing:1px;
          "
        >
          SHIPPING MILESTONES
        </div>

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          style="
            margin-top:12px;
          "
        >
          ${rows}
        </table>
      </div>
    `;
  }

  private buildShipmentHtml({
    customerName,
    shipmentNo,
    status,
    rawStatus,
    trackingUrl,
  }: {
    customerName: string;
    shipmentNo: string;
    status: string;
    rawStatus: string;
    trackingUrl: string;
  }): string {
    const safeName = this.escapeHtml(customerName);

    const safeShipment = this.escapeHtml(shipmentNo);

    const safeStatus = this.escapeHtml(status);

    const safeTrackingUrl = this.escapeHtml(trackingUrl);

    return `
<!doctype html>
<html lang="en">
  <body
    style="
      margin:0;
      padding:0;
      background:#f1f5f9;
      font-family:Arial,Helvetica,sans-serif;
      color:#0f172a;
    "
  >
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      style="background:#f1f5f9;padding:32px 12px;"
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="
              max-width:620px;
              background:#ffffff;
              border-radius:18px;
              overflow:hidden;
              box-shadow:0 8px 30px rgba(15,23,42,.08);
            "
          >
            <tr>
              <td
                style="
                  background:#020617;
                  padding:28px 32px;
                "
              >
                <div
                  style="
                    color:#38bdf8;
                    font-size:13px;
                    font-weight:700;
                    letter-spacing:3px;
                  "
                >
                  EUROATLAS CARGO
                </div>

                <div
                  style="
                    color:#ffffff;
                    font-size:28px;
                    font-weight:700;
                    margin-top:10px;
                  "
                >
                  Shipment update
                </div>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:34px 32px;
                "
              >
                <p
                  style="
                    font-size:17px;
                    margin:0 0 18px;
                  "
                >
                  Hello ${safeName},
                </p>

                <p
                  style="
                    font-size:16px;
                    line-height:1.6;
                    color:#475569;
                    margin:0 0 28px;
                  "
                >
                  The status of your shipment has been updated.
                  You can review the latest tracking information below.
                </p>

                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  style="
                    background:#f8fafc;
                    border:1px solid #e2e8f0;
                    border-radius:14px;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding:20px;
                        border-bottom:1px solid #e2e8f0;
                      "
                    >
                      <div
                        style="
                          color:#64748b;
                          font-size:12px;
                          text-transform:uppercase;
                          letter-spacing:1px;
                        "
                      >
                        Shipment number
                      </div>

                      <div
                        style="
                          margin-top:6px;
                          font-size:18px;
                          font-weight:700;
                        "
                      >
                        ${safeShipment}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:20px;
                      "
                    >
                      <div
                        style="
                          color:#64748b;
                          font-size:12px;
                          text-transform:uppercase;
                          letter-spacing:1px;
                        "
                      >
                        Current status
                      </div>

                      <div
                        style="
                          margin-top:6px;
                          font-size:18px;
                          font-weight:700;
                          color:#0369a1;
                        "
                      >
                        ${safeStatus}
                      </div>
                    </td>
                  </tr>
                </table>

                ${this.buildMilestonesHtml(rawStatus)}

                <div
                  style="
                    text-align:center;
                    margin:32px 0 24px;
                  "
                >
                  <a
                    href="${safeTrackingUrl}"
                    style="
                      display:inline-block;
                      background:#0f172a;
                      color:#ffffff;
                      text-decoration:none;
                      font-size:16px;
                      font-weight:700;
                      padding:15px 28px;
                      border-radius:10px;
                    "
                  >
                    Open Tracking Page
                  </a>
                </div>

                <p
                  style="
                    font-size:13px;
                    line-height:1.6;
                    color:#64748b;
                    margin:0;
                  "
                >
                  If the button does not work, copy this address
                  into your browser:
                  <br />
                  ${safeTrackingUrl}
                </p>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:22px 32px;
                  background:#f8fafc;
                  border-top:1px solid #e2e8f0;
                  font-size:12px;
                  color:#64748b;
                  text-align:center;
                "
              >
                EuroAtlas Cargo<br />
                Cargo management from Europe to North Africa
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
  }

  private formatStatus(status: string): string {
    return status
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
