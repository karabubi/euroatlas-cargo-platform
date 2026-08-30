import { GmailApiTransport } from './gmail-api.transport';

describe('GmailApiTransport', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('gets an OAuth token and sends an encoded Gmail message', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          access_token: 'test-access-token',
          expires_in: 3600,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          id: 'gmail-message-id',
        }),
      });

    global.fetch = fetchMock as typeof fetch;

    const transport = new GmailApiTransport({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      refreshToken: 'test-refresh-token',
    });

    const result = await transport.sendMail({
      from: 'EuroAtlas Cargo <sender@example.com>',
      to: ['customer@example.com'],
      subject: 'EuroAtlas Cargo – Tracking sent – EAC-2026-0001',
      text: 'Open the shipment tracking page.',
      html: '<p>Open the shipment tracking page.</p>',
    });

    expect(result).toEqual({
      messageId: 'gmail-message-id',
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({
        method: 'POST',
      }),
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-access-token',
        }),
      }),
    );

    const gmailRequest = fetchMock.mock.calls[1][1] as RequestInit;

    if (typeof gmailRequest.body !== 'string') {
      throw new Error('Expected Gmail request body to be a string.');
    }

    const body = JSON.parse(gmailRequest.body) as {
      raw: string;
    };

    expect(body.raw).toBeTruthy();
    expect(body.raw).not.toContain('+');
    expect(body.raw).not.toContain('/');
  });

  it('rejects an OAuth failure without calling Gmail send', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValue({
        error: 'invalid_grant',
        error_description: 'Bad Request',
      }),
    });

    global.fetch = fetchMock as typeof fetch;

    const transport = new GmailApiTransport({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      refreshToken: 'invalid-refresh-token',
    });

    await expect(
      transport.sendMail({
        from: 'sender@example.com',
        to: ['customer@example.com'],
        subject: 'Tracking update',
        text: 'Tracking update',
        html: '<p>Tracking update</p>',
      }),
    ).rejects.toThrow(
      'Google OAuth token request failed with HTTP 401: invalid_grant - Bad Request',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a Gmail API delivery failure', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          access_token: 'test-access-token',
          expires_in: 3600,
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: jest.fn().mockResolvedValue({
          error: {
            message: 'Insufficient permissions',
          },
        }),
      });

    global.fetch = fetchMock as typeof fetch;

    const transport = new GmailApiTransport({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      refreshToken: 'test-refresh-token',
    });

    await expect(
      transport.sendMail({
        from: 'sender@example.com',
        to: ['customer@example.com'],
        subject: 'Tracking update',
        text: 'Tracking update',
        html: '<p>Tracking update</p>',
      }),
    ).rejects.toThrow('Gmail API send failed with HTTP 403.');
  });
});
