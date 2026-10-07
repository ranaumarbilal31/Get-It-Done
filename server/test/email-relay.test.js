import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import relay from '../../client/api/account-email.js';
function response() {
  return {
    statusCode: 200,
    setHeader() {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    end() {
      return this;
    },
    json() {
      return this;
    },
  };
}
describe('Signed account email relay', () => {
  it('rejects methods other than POST', async () => {
    const res = response();
    await relay({ method: 'GET' }, res);
    expect(res.statusCode).toBe(405);
  });
  it('fails truthfully when sender configuration is missing', async () => {
    const res = response();
    await relay({ method: 'POST' }, res);
    expect(res.statusCode).toBe(503);
  });
  it('rejects unsigned, expired, replayed and arbitrary-template requests', async () => {
    const saved = Object.fromEntries(
      ['EMAIL_RELAY_SECRET', 'GMAIL_USER', 'GMAIL_APP_PASSWORD'].map((k) => [k, process.env[k]]),
    );
    Object.assign(process.env, {
      EMAIL_RELAY_SECRET: 'relay-test-secret',
      GMAIL_USER: 'owner@example.com',
      GMAIL_APP_PASSWORD: 'dummy-not-a-real-secret',
    });
    try {
      for (const type of ['unsigned', 'expired', 'template']) {
        const body = {
          to: 'recipient@example.com',
          kind: 'arbitrary',
          link: 'https://untrusted.example',
        };
        const timestamp = String(Date.now() - (type === 'expired' ? 120000 : 0));
        const signature = crypto
          .createHmac('sha256', process.env.EMAIL_RELAY_SECRET)
          .update(timestamp + '.' + JSON.stringify(body))
          .digest('hex');
        const req = {
          method: 'POST',
          body,
          headers:
            type === 'unsigned'
              ? {}
              : { 'x-email-timestamp': timestamp, 'x-email-signature': signature },
        };
        const res = response();
        await relay(req, res);
        expect(res.statusCode).toBe(type === 'template' ? 400 : 401);
        if (type === 'template') {
          const again = response();
          await relay(req, again);
          expect(again.statusCode).toBe(409);
        }
      }
    } finally {
      for (const [key, value] of Object.entries(saved))
        value === undefined ? delete process.env[key] : (process.env[key] = value);
    }
  });
});
