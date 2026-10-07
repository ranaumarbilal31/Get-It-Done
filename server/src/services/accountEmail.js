const crypto = require('node:crypto');
const { fail } = require('./fees');
const captures = [];
async function sendAccountEmail(to, kind, token) {
  const site = process.env.PUBLIC_SITE_URL || 'https://get-it-done-steel.vercel.app';
  const link =
    site + (kind === 'activation' ? '/verify-email' : '/reset-password') + '#token=' + token;
  if (process.env.NODE_ENV === 'test' && process.env.EMAIL_TRANSPORT === 'capture') {
    captures.push({ to, kind, link, token });
    return;
  }
  const endpoint = process.env.EMAIL_RELAY_URL;
  const secret = process.env.EMAIL_RELAY_SECRET;
  if (!endpoint || !secret)
    throw fail(503, 'Account email delivery is unavailable. Please try again later.');
  const payload = JSON.stringify({ to, kind, link });
  const timestamp = String(Date.now());
  const signature = crypto
    .createHmac('sha256', secret)
    .update(timestamp + '.' + payload)
    .digest('hex');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-email-timestamp': timestamp,
        'x-email-signature': signature,
      },
      body: payload,
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('Provider refused delivery');
  } catch {
    throw fail(503, 'Account email delivery is unavailable. Please try again later.');
  }
}
module.exports = { sendAccountEmail, captures };
