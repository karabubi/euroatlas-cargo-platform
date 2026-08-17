import { createGmailApiTransport } from './gmail-api.transport';

import type { ShipmentTrackingNotification } from '../notification.types';
import { EmailNotificationProvider } from './email.provider';

const sendMail = jest.fn();

jest.mock('./gmail-api.transport', () => ({
  createGmailApiTransport: jest.fn(),
}));

const notification = (
  overrides: Partial<ShipmentTrackingNotification> = {},
): ShipmentTrackingNotification => ({
  shipmentId: '11111111-1111-1111-1111-111111111111',
  shipmentNo: 'EAC-2026-0001',
  trackingNumber: 'EAC-2026-0001',
  status: 'IN_TRANSIT',
  customerName: 'Test Customer',
  customerEmail: 'customer@example.com',
  customerPhone: null,
  trackingUrl: 'https://example.com/track/EAC-2026-0001',
  ...overrides,
});

describe('EmailNotificationProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    sendMail.mockReset();
    sendMail.mockResolvedValue({
      messageId: 'gmail-test-message-id',
    });

    jest.mocked(createGmailApiTransport).mockReturnValue({
      sendMail,
    } as never);

    process.env = {
      ...originalEnv,
      GMAIL_OAUTH_CLIENT_ID: 'test-client-id',
      GMAIL_OAUTH_CLIENT_SECRET: 'test-client-secret',
      GMAIL_OAUTH_REFRESH_TOKEN: 'test-refresh-token',
      EMAIL_FROM: 'EuroAtlas Cargo <alkarabubi@gmail.com>',
    };

    delete process.env.ADMIN_NOTIFICATION_EMAIL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('creates a Gmail API transport from environment configuration', () => {
    new EmailNotificationProvider();

    expect(createGmailApiTransport).toHaveBeenCalledWith({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      refreshToken: 'test-refresh-token',
    });
  });

  it('sends tracking email only to the customer email', async () => {
    const provider = new EmailNotificationProvider();
    const result = await provider.sendShipmentUpdate(notification());

    expect(result).toBe(true);

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'EuroAtlas Cargo <alkarabubi@gmail.com>',
        to: ['customer@example.com'],
        subject: 'EuroAtlas Cargo – Tracking sent – EAC-2026-0001',
        text: expect.stringContaining(
          'https://example.com/track/EAC-2026-0001',
        ),
        html: expect.stringContaining('Open Tracking Page'),
      }),
    );
  });

  it('does not send when the customer email is missing', async () => {
    const provider = new EmailNotificationProvider();

    const result = await provider.sendShipmentUpdate(
      notification({
        customerEmail: null,
      }),
    );

    expect(result).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('disables email when Gmail API configuration is incomplete', async () => {
    delete process.env.GMAIL_OAUTH_REFRESH_TOKEN;

    const provider = new EmailNotificationProvider();
    const result = await provider.sendShipmentUpdate(notification());

    expect(result).toBe(false);
    expect(createGmailApiTransport).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('returns false when Gmail API rejects the customer email', async () => {
    sendMail.mockRejectedValueOnce(new Error('Gmail API test failure'));

    const provider = new EmailNotificationProvider();
    const result = await provider.sendShipmentUpdate(notification());

    expect(result).toBe(false);
  });

  it('sends admin confirmation when configured', async () => {
    process.env.ADMIN_NOTIFICATION_EMAIL = 'alkarabubi@gmail.com';

    const provider = new EmailNotificationProvider();
    const result = await provider.sendShipmentUpdate(notification());

    expect(result).toBe(true);
    expect(sendMail).toHaveBeenCalledTimes(2);

    expect(sendMail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        from: 'EuroAtlas Cargo <alkarabubi@gmail.com>',
        to: ['alkarabubi@gmail.com'],
        subject: 'EuroAtlas Cargo – Tracking sent – EAC-2026-0001',
      }),
    );
  });
});

describe('Email HTML safety and milestones', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    sendMail.mockReset();
    sendMail.mockResolvedValue({
      messageId: 'gmail-html-test',
    });

    jest.mocked(createGmailApiTransport).mockReturnValue({
      sendMail,
    } as never);

    process.env = {
      ...originalEnv,
      GMAIL_OAUTH_CLIENT_ID: 'test-client-id',
      GMAIL_OAUTH_CLIENT_SECRET: 'test-client-secret',
      GMAIL_OAUTH_REFRESH_TOKEN: 'test-refresh-token',
      EMAIL_FROM: 'EuroAtlas Cargo <alkarabubi@gmail.com>',
    };

    delete process.env.ADMIN_NOTIFICATION_EMAIL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('escapes customer-controlled HTML content', async () => {
    const provider = new EmailNotificationProvider();

    await provider.sendShipmentUpdate(
      notification({
        customerName: '<script>alert("x")</script>',
      }),
    );

    const message = sendMail.mock.calls[0][0] as {
      html: string;
    };

    expect(message.html).toContain('&lt;script&gt;');
    expect(message.html).not.toContain('<script>');
  });

  it('renders DRAFT as the active first milestone', async () => {
    const provider = new EmailNotificationProvider();

    await provider.sendShipmentUpdate(
      notification({
        status: 'DRAFT',
      }),
    );

    const message = sendMail.mock.calls[0][0] as {
      text: string;
      html: string;
    };

    expect(message.text).toContain('● Draft');
    expect(message.text).toContain('○ Booked');
    expect(message.text).toContain('○ Delivered');
    expect(message.html).toContain('Draft');
    expect(message.html).toContain('Open Tracking Page');
  });

  it('renders IN_TRANSIT with prior milestones complete', async () => {
    const provider = new EmailNotificationProvider();

    await provider.sendShipmentUpdate(notification());

    const message = sendMail.mock.calls[0][0] as {
      text: string;
    };

    expect(message.text).toContain('✓ Booked');
    expect(message.text).toContain('✓ Received');
    expect(message.text).toContain('✓ Loaded');
    expect(message.text).toContain('● In Transit');
    expect(message.text).toContain('○ Arrived');
  });

  it('renders DELIVERED with every milestone complete', async () => {
    const provider = new EmailNotificationProvider();

    await provider.sendShipmentUpdate(
      notification({
        status: 'DELIVERED',
      }),
    );

    const message = sendMail.mock.calls[0][0] as {
      text: string;
    };

    expect(message.text).toContain('✓ Draft');
    expect(message.text).toContain('✓ Booked');
    expect(message.text).toContain('✓ Delivered');
    expect(message.text).not.toContain('● Delivered');
  });

  it('renders CANCELLED separately from normal milestones', async () => {
    const provider = new EmailNotificationProvider();

    await provider.sendShipmentUpdate(
      notification({
        status: 'CANCELLED',
      }),
    );

    const message = sendMail.mock.calls[0][0] as {
      text: string;
      html: string;
    };

    expect(message.text).toContain('✕ Shipment Cancelled');
    expect(message.html).toContain('Shipment Cancelled');
  });
});
