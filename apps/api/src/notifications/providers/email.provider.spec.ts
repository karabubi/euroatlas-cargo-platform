import { Resend } from 'resend';

import { EmailNotificationProvider } from './email.provider';

const send = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send,
    },
  })),
}));

describe('EmailNotificationProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    send.mockReset();

    send.mockResolvedValue({
      data: {
        id: 'test-email-id',
      },
      error: null,
    });

    process.env = {
      ...originalEnv,
      RESEND_API_KEY: 're_test_api_key',
      EMAIL_FROM: 'EuroAtlas Cargo <notifications@example.com>',
    };

    delete process.env.ADMIN_NOTIFICATION_EMAIL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('creates a Resend client from environment configuration', () => {
    new EmailNotificationProvider();

    expect(Resend).toHaveBeenCalledWith('re_test_api_key');
  });

  it('sends a shipment tracking email', async () => {
    const provider = new EmailNotificationProvider();

    const result = await provider.sendShipmentUpdate({
      shipmentId: '11111111-1111-1111-1111-111111111111',
      shipmentNo: 'EAC-2026-0001',
      trackingNumber: 'EAC-2026-0001',
      status: 'IN_TRANSIT',
      customerName: 'Test Customer',
      customerEmail: 'customer@example.com',
      customerPhone: null,
      trackingUrl: 'http://localhost:3000/track/EAC-2026-0001',
    });

    expect(result).toBe(true);

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'EuroAtlas Cargo <notifications@example.com>',
        to: ['customer@example.com'],
        subject: 'EuroAtlas Cargo – Shipment EAC-2026-0001',
        text: expect.stringContaining(
          'http://localhost:3000/track/EAC-2026-0001',
        ),
        html: expect.stringContaining('Track Shipment'),
      }),
    );
  });

  it('does not send when customer email is missing', async () => {
    const provider = new EmailNotificationProvider();

    const result = await provider.sendShipmentUpdate({
      shipmentId: '11111111-1111-1111-1111-111111111111',
      shipmentNo: 'EAC-2026-0001',
      trackingNumber: 'EAC-2026-0001',
      status: 'IN_TRANSIT',
      customerName: 'Test Customer',
      customerEmail: null,
      customerPhone: null,
      trackingUrl: 'http://localhost:3000/track/EAC-2026-0001',
    });

    expect(result).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it('disables email when RESEND_API_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY;

    const provider = new EmailNotificationProvider();

    const result = await provider.sendShipmentUpdate({
      shipmentId: '11111111-1111-1111-1111-111111111111',
      shipmentNo: 'EAC-2026-0001',
      trackingNumber: 'EAC-2026-0001',
      status: 'IN_TRANSIT',
      customerName: 'Test Customer',
      customerEmail: 'customer@example.com',
      customerPhone: null,
      trackingUrl: 'http://localhost:3000/track/EAC-2026-0001',
    });

    expect(result).toBe(false);
    expect(Resend).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('returns false when Resend rejects the customer email', async () => {
    send.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Resend test failure',
      },
    });

    const provider = new EmailNotificationProvider();

    const result = await provider.sendShipmentUpdate({
      shipmentId: '11111111-1111-1111-1111-111111111111',
      shipmentNo: 'EAC-2026-0001',
      trackingNumber: 'EAC-2026-0001',
      status: 'IN_TRANSIT',
      customerName: 'Test Customer',
      customerEmail: 'customer@example.com',
      customerPhone: null,
      trackingUrl: 'http://localhost:3000/track/EAC-2026-0001',
    });

    expect(result).toBe(false);
  });

  it('sends admin confirmation when configured', async () => {
    process.env.ADMIN_NOTIFICATION_EMAIL = 'admin@example.com';

    const provider = new EmailNotificationProvider();

    const result = await provider.sendShipmentUpdate({
      shipmentId: '11111111-1111-1111-1111-111111111111',
      shipmentNo: 'EAC-2026-0001',
      trackingNumber: 'EAC-2026-0001',
      status: 'IN_TRANSIT',
      customerName: 'Test Customer',
      customerEmail: 'customer@example.com',
      customerPhone: null,
      trackingUrl: 'http://localhost:3000/track/EAC-2026-0001',
    });

    expect(result).toBe(true);
    expect(send).toHaveBeenCalledTimes(2);

    expect(send).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        from: 'EuroAtlas Cargo <notifications@example.com>',
        to: ['admin@example.com'],
        subject: 'EuroAtlas Cargo – Tracking sent – EAC-2026-0001',
      }),
    );
  });
});

describe('Email HTML safety', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    send.mockReset();

    send.mockResolvedValue({
      data: {
        id: 'safe-html-test',
      },
      error: null,
    });

    process.env = {
      ...originalEnv,
      RESEND_API_KEY: 're_test_api_key',
      EMAIL_FROM: 'EuroAtlas Cargo <notifications@example.com>',
    };

    delete process.env.ADMIN_NOTIFICATION_EMAIL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('escapes customer-controlled HTML content', async () => {
    const provider = new EmailNotificationProvider();

    await provider.sendShipmentUpdate({
      shipmentId: '11111111-1111-1111-1111-111111111111',
      shipmentNo: 'EAC-2026-0001',
      trackingNumber: 'EAC-2026-0001',
      status: 'IN_TRANSIT',
      customerName: '<script>alert("x")</script>',
      customerEmail: 'customer@example.com',
      customerPhone: null,
      trackingUrl: 'http://localhost:3000/track/EAC-2026-0001',
    });

    const message = send.mock.calls[0][0];

    expect(message.html).toContain('&lt;script&gt;');

    expect(message.html).not.toContain('<script>');
  });
});
