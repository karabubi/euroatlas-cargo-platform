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

  it('renders DRAFT as the active first shipping milestone', async () => {
    const send = jest.fn().mockResolvedValue({
      data: { id: 'email-draft' },
      error: null,
    });

    (Resend as jest.Mock).mockImplementation(() => ({
      emails: { send },
    }));

    process.env.RESEND_API_KEY = 're_test_key';
    process.env.EMAIL_FROM = 'EuroAtlas Cargo <tracking@example.com>';

    const provider = new EmailNotificationProvider();

    await provider.sendShipmentUpdate({
      shipmentId: '11111111-1111-1111-1111-111111111111',
      shipmentNo: 'EAC-2026-0001',
      trackingNumber: 'EAC-2026-0001',
      status: 'DRAFT',
      customerName: 'Test Customer',
      customerEmail: 'customer@example.com',
      customerPhone: null,
      trackingUrl: 'https://example.com/track/EAC-2026-0001',
    });

    expect(send).toHaveBeenCalled();

    const customerEmail = send.mock.calls[0][0];

    expect(customerEmail.text).toContain('● Draft');
    expect(customerEmail.text).toContain('○ Booked');
    expect(customerEmail.text).toContain('○ Received');
    expect(customerEmail.text).toContain('○ Loaded');
    expect(customerEmail.text).toContain('○ In Transit');
    expect(customerEmail.text).toContain('○ Arrived');
    expect(customerEmail.text).toContain('○ Customs Clearance');
    expect(customerEmail.text).toContain('○ Ready for Delivery');
    expect(customerEmail.text).toContain('○ Delivered');

    expect(customerEmail.html).toContain('Draft');
    expect(customerEmail.html).toContain('Booked');
    expect(customerEmail.html).toContain('Received');
    expect(customerEmail.html).toContain('Loaded');
    expect(customerEmail.html).toContain('In Transit');
    expect(customerEmail.html).toContain('Arrived');
    expect(customerEmail.html).toContain('Customs Clearance');
    expect(customerEmail.html).toContain('Ready for Delivery');
    expect(customerEmail.html).toContain('Delivered');
  });

  it('renders IN_TRANSIT milestones with previous stages completed', async () => {
    const send = jest.fn().mockResolvedValue({
      data: { id: 'email-in-transit' },
      error: null,
    });

    (Resend as jest.Mock).mockImplementation(() => ({
      emails: { send },
    }));

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

    const message = send.mock.calls[0][0];

    expect(message.text).toContain('✓ Booked');
    expect(message.text).toContain('✓ Received');
    expect(message.text).toContain('✓ Loaded');
    expect(message.text).toContain('● In Transit');
    expect(message.text).toContain('○ Arrived');
  });

  it('renders DELIVERED with every milestone completed', async () => {
    const send = jest.fn().mockResolvedValue({
      data: { id: 'email-delivered' },
      error: null,
    });

    (Resend as jest.Mock).mockImplementation(() => ({
      emails: { send },
    }));

    const provider = new EmailNotificationProvider();

    const result = await provider.sendShipmentUpdate({
      shipmentId: '11111111-1111-1111-1111-111111111111',
      shipmentNo: 'EAC-2026-0001',
      trackingNumber: 'EAC-2026-0001',
      status: 'DELIVERED',
      customerName: 'Test Customer',
      customerEmail: 'customer@example.com',
      customerPhone: null,
      trackingUrl: 'http://localhost:3000/track/EAC-2026-0001',
    });

    expect(result).toBe(true);

    const message = send.mock.calls[0][0];

    expect(message.text).toContain('✓ Booked');
    expect(message.text).toContain('✓ Received');
    expect(message.text).toContain('✓ Loaded');
    expect(message.text).toContain('✓ In Transit');
    expect(message.text).toContain('✓ Arrived');
    expect(message.text).toContain('✓ Customs Clearance');
    expect(message.text).toContain('✓ Ready for Delivery');
    expect(message.text).toContain('✓ Delivered');
    expect(message.text).not.toContain('● Delivered');
  });

  it('renders CANCELLED as cancelled instead of a normal milestone', async () => {
    const send = jest.fn().mockResolvedValue({
      data: { id: 'email-cancelled' },
      error: null,
    });

    (Resend as jest.Mock).mockImplementation(() => ({
      emails: { send },
    }));

    const provider = new EmailNotificationProvider();

    const result = await provider.sendShipmentUpdate({
      shipmentId: '11111111-1111-1111-1111-111111111111',
      shipmentNo: 'EAC-2026-0001',
      trackingNumber: 'EAC-2026-0001',
      status: 'CANCELLED',
      customerName: 'Test Customer',
      customerEmail: 'customer@example.com',
      customerPhone: null,
      trackingUrl: 'http://localhost:3000/track/EAC-2026-0001',
    });

    expect(result).toBe(true);

    const message = send.mock.calls[0][0];

    expect(message.text).toContain('✕ Shipment Cancelled');
    expect(message.html).toContain('Shipment Cancelled');
  });
});
