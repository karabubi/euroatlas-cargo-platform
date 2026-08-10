import { EmailNotificationProvider } from '../src/notifications/providers/email.provider';

async function main(): Promise<void> {
  const recipient = process.env.TEST_EMAIL_TO?.trim();

  if (!recipient) {
    throw new Error('TEST_EMAIL_TO is required.');
  }

  const trackingBase =
    process.env.PUBLIC_TRACKING_URL?.replace(/\/+$/, '') ??
    'http://localhost:3000/track';

  const provider = new EmailNotificationProvider();

  console.log('===== EUROATLAS HTML EMAIL TEST =====');

  console.log('Recipient configured: yes');

  const sent = await provider.sendShipmentUpdate({
    shipmentId: '11111111-1111-1111-1111-111111111111',

    shipmentNo: 'EAC-2026-0001',

    trackingNumber: 'EAC-2026-0001',

    status: 'IN_TRANSIT',

    customerName: 'EuroAtlas Test Customer',

    customerEmail: recipient,

    customerPhone: null,

    trackingUrl: `${trackingBase}/EAC-2026-0001`,
  });

  if (!sent) {
    throw new Error('Email provider did not send the test message.');
  }

  console.log();
  console.log('✅ Professional tracking email sent.');
}

main().catch((error: unknown) => {
  console.error('❌ Tracking email test failed.');

  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exit(1);
});
