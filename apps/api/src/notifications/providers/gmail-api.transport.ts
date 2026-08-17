export type GmailApiMail = {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
};

export type GmailApiTransportConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

type GoogleTokenResponse = {
  access_token?: unknown;
  expires_in?: unknown;
};

type GmailSendResponse = {
  id?: unknown;
};

export class GmailApiTransport {
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;

  constructor(private readonly config: GmailApiTransportConfig) {}

  async sendMail(mail: GmailApiMail): Promise<{ messageId: string }> {
    const accessToken = await this.getAccessToken();
    const raw = this.buildRawMessage(mail);

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw,
        }),
      },
    );

    const data: unknown = await response.json();

    if (!response.ok) {
      throw new Error(`Gmail API send failed with HTTP ${response.status}.`);
    }

    if (!this.isGmailSendResponse(data) || typeof data.id !== 'string') {
      throw new Error('Gmail API returned an invalid send response.');
    }

    return {
      messageId: data.id,
    };
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.config.refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      throw new Error(
        `Google OAuth token request failed with HTTP ${response.status}.`,
      );
    }

    if (
      !this.isGoogleTokenResponse(data) ||
      typeof data.access_token !== 'string'
    ) {
      throw new Error('Google OAuth returned an invalid access token.');
    }

    const expiresIn =
      typeof data.expires_in === 'number' ? data.expires_in : 3600;

    this.accessToken = data.access_token;
    this.accessTokenExpiresAt =
      Date.now() + Math.max(expiresIn - 60, 60) * 1000;

    return this.accessToken;
  }

  private buildRawMessage(mail: GmailApiMail): string {
    const boundary = `euroatlas-${Date.now()}`;

    const message = [
      `From: ${this.cleanHeader(mail.from)}`,
      `To: ${mail.to.map((address) => this.cleanHeader(address)).join(', ')}`,
      `Subject: ${this.encodeHeader(mail.subject)}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      this.encodeBody(mail.text),
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      this.encodeBody(mail.html),
      '',
      `--${boundary}--`,
      '',
    ].join('\r\n');

    return Buffer.from(message, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  private cleanHeader(value: string): string {
    return value.replace(/[\r\n]+/g, ' ').trim();
  }

  private encodeHeader(value: string): string {
    const cleanValue = this.cleanHeader(value);
    const encoded = Buffer.from(cleanValue, 'utf8').toString('base64');

    return `=?UTF-8?B?${encoded}?=`;
  }

  private encodeBody(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64');
  }

  private isGoogleTokenResponse(value: unknown): value is GoogleTokenResponse {
    return typeof value === 'object' && value !== null;
  }

  private isGmailSendResponse(value: unknown): value is GmailSendResponse {
    return typeof value === 'object' && value !== null;
  }
}

export const createGmailApiTransport = (
  config: GmailApiTransportConfig,
): GmailApiTransport => new GmailApiTransport(config);
