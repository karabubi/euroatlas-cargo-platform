import { WhatsAppNotificationProvider } from './whatsapp.provider';

describe('WhatsAppNotificationProvider', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.WHATSAPP_ACCESS_TOKEN = 'test-token';

    process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789';

    process.env.WHATSAPP_API_VERSION = 'v22.0';

    process.env.WHATSAPP_TRACKING_TEMPLATE = 'shipment_tracking_update';

    process.env.WHATSAPP_TEMPLATE_LANGUAGE = 'en';

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(''),
    }) as jest.Mock;
  });

  afterEach(() => {
    global.fetch = originalFetch;

    jest.clearAllMocks();
  });

  it('sends shipment tracking milestones', async () => {
    const provider = new WhatsAppNotificationProvider();

    const sent = await provider.sendShipmentUpdate({
      shipmentId: '11111111-1111-1111-1111-111111111111',

      shipmentNo: 'EAC-2026-0001',

      trackingNumber: 'EAC-2026-0001',

      status: 'IN_TRANSIT',

      customerName: 'Atlas Auto Trading',

      customerEmail: 'customer@example.com',

      customerPhone: '+49 176 12345678',

      trackingUrl: 'http://localhost:3000/track/EAC-2026-0001',
    });

    expect(sent).toBe(true);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    const call = (global.fetch as jest.Mock).mock.calls[0];

    expect(call[0]).toBe('https://graph.facebook.com/v22.0/123456789/messages');

    const options = call[1] as {
      body: string;
    };

    const body = JSON.parse(options.body);

    expect(body.to).toBe('4917612345678');

    const parameters = body.template.components[0].parameters;

    expect(parameters).toHaveLength(4);

    expect(parameters[0].text).toBe('EAC-2026-0001');

    expect(parameters[1].text).toBe('In Transit');

    expect(parameters[2].text).toContain('/track/EAC-2026-0001');

    expect(parameters[3].text).toContain('● In Transit');

    expect(parameters[3].text).toContain('○ Delivered');
  });

  it('does not send without a valid phone', async () => {
    const provider = new WhatsAppNotificationProvider();

    const sent = await provider.sendShipmentUpdate({
      shipmentId: '11111111-1111-1111-1111-111111111111',

      shipmentNo: 'EAC-2026-0001',

      trackingNumber: 'EAC-2026-0001',

      status: 'IN_TRANSIT',

      customerPhone: null,

      trackingUrl: 'http://localhost:3000/track/EAC-2026-0001',
    });

    expect(sent).toBe(false);

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
