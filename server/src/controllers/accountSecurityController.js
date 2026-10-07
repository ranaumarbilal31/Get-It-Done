const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { sendAccountEmail } = require('../services/accountEmail');
const { fail } = require('../services/fees');
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
async function issue(user, kind) {
  const token = crypto.randomBytes(32).toString('hex');
  const data =
    kind === 'activation'
      ? { emailVerifyToken: hash(token), emailVerifyExpires: new Date(Date.now() + 86400000) }
      : { resetPasswordToken: hash(token), resetPasswordExpires: new Date(Date.now() + 1800000) };
  await prisma.user.update({ where: { id: user.id }, data });
  await sendAccountEmail(user.email, kind, token);
}
const wrap = (handler) => async (req, res, next) => {
  try {
    await handler(req, res);
  } catch (e) {
    next(e);
  }
};
const requestLink = (kind) =>
  wrap(async (req, res) => {
    if (
      typeof req.body.email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email) ||
      req.body.email.length > 254
    )
      throw fail(400, 'Enter a valid email address.');
    // Check delivery readiness for every request, avoiding account enumeration through provider errors.
    if (
      !(process.env.NODE_ENV === 'test' && process.env.EMAIL_TRANSPORT === 'capture') &&
      (!process.env.EMAIL_RELAY_URL || !process.env.EMAIL_RELAY_SECRET)
    )
      throw fail(503, 'Account email delivery is unavailable. Please try again later.');
    const user = await prisma.user.findUnique({
      where: { email: req.body.email.trim().toLowerCase() },
    });
    if (user && (kind !== 'activation' || !user.isEmailVerified)) {
      try {
        await issue(user, kind);
      } catch {
        /* Generic response prevents enumeration; registration exposes provider failure. */
      }
    }
    res.json({
      message:
        'If this account is eligible, your request has been recorded. If no email arrives, retry or contact support.',
    });
  });
const verify = wrap(async (req, res) => {
  if (typeof req.body.token !== 'string' || !/^[a-f0-9]{64}$/.test(req.body.token))
    throw fail(400, 'Invalid activation link.');
  const updated = await prisma.user.updateMany({
    where: {
      emailVerifyToken: hash(req.body.token),
      emailVerifyExpires: { gt: new Date() },
      isEmailVerified: false,
    },
    data: { isEmailVerified: true, emailVerifyToken: null, emailVerifyExpires: null },
  });
  if (updated.count !== 1)
    throw fail(
      400,
      'This activation link has expired or has already been used. Request another email.',
    );
  res.json({ message: 'Your account is activated. You can now log in.' });
});
function password(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 100)
    throw fail(400, 'Use a password of 8–100 characters.');
}
const reset = wrap(async (req, res) => {
  password(req.body.password);
  if (typeof req.body.token !== 'string' || !/^[a-f0-9]{64}$/.test(req.body.token))
    throw fail(400, 'Invalid reset link.');
  const user = await prisma.user.findFirst({
    where: { resetPasswordToken: hash(req.body.token), resetPasswordExpires: { gt: new Date() } },
  });
  if (!user) throw fail(400, 'This reset link has expired or has already been used.');
  const encoded = await bcrypt.hash(req.body.password, 10);
  const result = await prisma.user.updateMany({
    where: {
      id: user.id,
      resetPasswordToken: hash(req.body.token),
      resetPasswordExpires: { gt: new Date() },
    },
    data: {
      password: encoded,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      sessionVersion: { increment: 1 },
    },
  });
  if (!result.count) throw fail(400, 'This reset link has already been used.');
  req.app
    .get('io')
    ?.in('user_' + user.id)
    .disconnectSockets(true);
  res.json({ message: 'Password updated. Log in with your new password.' });
});
const change = wrap(async (req, res) => {
  password(req.body.password);
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (
    typeof req.body.currentPassword !== 'string' ||
    !(await bcrypt.compare(req.body.currentPassword, user.password))
  )
    throw fail(400, 'Your current password is incorrect.');
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await bcrypt.hash(req.body.password, 10),
      sessionVersion: { increment: 1 },
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });
  req.app
    .get('io')
    ?.in('user_' + user.id)
    .disconnectSockets(true);
  res.json({ message: 'Password updated. Please log in again.' });
});
module.exports = {
  issue,
  verify,
  reset,
  change,
  resend: requestLink('activation'),
  forgot: requestLink('reset'),
};
