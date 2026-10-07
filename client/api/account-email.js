import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  const secret = process.env.EMAIL_RELAY_SECRET;
  if (!secret || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD)
    return res.status(503).json({ error: 'Email unavailable' });
  const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const timestamp = req.headers['x-email-timestamp'];
  const signature = req.headers['x-email-signature'];
  if (
    !/^\d{13}$/.test(String(timestamp)) ||
    Math.abs(Date.now() - Number(timestamp)) > 60000 ||
    !/^[a-f0-9]{64}$/.test(String(signature)) ||
    Buffer.byteLength(payload) > 4096
  )
    return res.status(401).end();
  const expected = crypto
    .createHmac('sha256', secret)
    .update(timestamp + '.' + payload)
    .digest();
  if (!crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex')))
    return res.status(401).end();
  const used = (globalThis.__emailRelayUsed ||= new Map());
  for (const [key, expiry] of used) if (expiry < Date.now()) used.delete(key);
  if (used.has(signature)) return res.status(409).end();
  used.set(signature, Date.now() + 120000);
  let body;
  try {
    body = JSON.parse(payload);
  } catch {
    return res.status(400).end();
  }
  const site = process.env.PUBLIC_SITE_URL || 'https://get-it-done-steel.vercel.app';
  const path =
    body.kind === 'activation' ? '/verify-email' : body.kind === 'reset' ? '/reset-password' : null;
  if (
    !path ||
    typeof body.to !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.to) ||
    body.to.length > 254 ||
    typeof body.link !== 'string' ||
    !body.link.startsWith(site + path + '#token=') ||
    !/^[a-f0-9]{64}$/.test(body.link.split('#token=')[1] || '')
  )
    return res.status(400).end();
  try {
    const transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      connectionTimeout: 10000,
      socketTimeout: 15000,
    });
    await transport.sendMail({
      from: { name: 'Get It Done', address: process.env.GMAIL_USER },
      to: body.to,
      subject:
        body.kind === 'activation'
          ? 'Activate your Get It Done account'
          : 'Reset your Get It Done password',
      text: `${body.kind === 'activation' ? 'Activate your account' : 'Reset your password'}: ${body.link}\nThis link expires ${body.kind === 'activation' ? 'in 24 hours' : 'in 30 minutes'}. If you did not request this, ignore this email.`,
    });
    return res.json({ accepted: true });
  } catch {
    return res.status(502).json({ error: 'Email delivery failed' });
  }
}
