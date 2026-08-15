import nodemailer from 'nodemailer';

import { EmailNotificationProvider } from './email.provider';

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}));

describe('EmailNotificationProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env = {
      ...originalEnv,
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'notifications@example.com',
      SMTP_PASSWORD: 'test-password',
      EMAIL_FROM: 'EuroAtlas Cargo <notifications@example.com>',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('creates an SMTP transporter from environment configuration', () => {
    const sendMail = jest.fn();

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      verify: jest.fn().mockResolvedValue(true),
      sendMail,
    });

    new EmailNotificationProvider();

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'notifications@example.com',
        pass: 'test-password',
      },
    });
  });

  it('sends a shipment tracking email', async () => {
    const sendMail = jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
    });

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      verify: jest.fn().mockResolvedValue(true),
      sendMail,
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

    expect(result).toBe(true);

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'EuroAtlas Cargo <notifications@example.com>',

        to: 'customer@example.com',

        subject: 'EuroAtlas Cargo – Shipment EAC-2026-0001',

        text: expect.stringContaining(
          'http://localhost:3000/track/EAC-2026-0001',
        ),

        html: expect.stringContaining('Track Shipment'),
      }),
    );
  });

  it('does not send when customer email is missing', async () => {
    const sendMail = jest.fn();

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      verify: jest.fn().mockResolvedValue(true),
      sendMail,
    });

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
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('disables email when SMTP configuration is incomplete', async () => {
    delete process.env.SMTP_PASSWORD;

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

    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });
});

describe('Email HTML safety', () => {
  beforeEach(() => {
    process.env = {
      ...process.env,
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'notifications@example.com',
      SMTP_PASSWORD: 'test-password',
      EMAIL_FROM: 'EuroAtlas Cargo <notifications@example.com>',
    };
  });

  it('escapes customer-controlled HTML content', async () => {
    const sendMail = jest.fn().mockResolvedValue({
      messageId: 'safe-html-test',
    });

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      verify: jest.fn().mockResolvedValue(true),
      sendMail,
    });

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

    const message = sendMail.mock.calls[0][0];

    expect(message.html).toContain('&lt;script&gt;');

    expect(message.html).not.toContain('<script>');
  });
});
