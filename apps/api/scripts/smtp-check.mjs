import nodemailer from 'nodemailer';

const required = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'EMAIL_FROM',
];

const missing = required.filter((key) => !process.env[key]?.trim());

if (missing.length > 0) {
  console.error('❌ Missing SMTP settings:', missing.join(', '));

  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,

  port: Number(process.env.SMTP_PORT),

  secure: process.env.SMTP_SECURE === 'true',

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

console.log('===== SMTP CONNECTION TEST =====');

await transporter.verify();

console.log('✅ SMTP connection and authentication successful.');

const recipient = process.env.TEST_EMAIL_TO?.trim();

if (!recipient) {
  console.log();
  console.log('ℹ️ TEST_EMAIL_TO is not set.');
  console.log('Connection verified; no email was sent.');

  process.exit(0);
}

const trackingUrl = `${
  process.env.PUBLIC_TRACKING_URL ?? 'http://localhost:3000/track'
}/EAC-2026-0001`;

const info = await transporter.sendMail({
  from: process.env.EMAIL_FROM,

  to: recipient,

  subject: 'EuroAtlas Cargo – Email Test',

  text: [
    'Hello,',
    '',
    'This is a EuroAtlas Cargo email configuration test.',
    '',
    'Shipment: EAC-2026-0001',
    'Status: IN TRANSIT',
    '',
    'Track shipment:',
    trackingUrl,
    '',
    'EuroAtlas Cargo',
  ].join('\n'),
});

console.log();
console.log('✅ Test email accepted by SMTP server.');

console.log('Message ID:', info.messageId);
