import { beforeAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
import prisma from '../src/config/prisma.js';
import { breakdown, cents } from '../src/services/fees.js';
import { createRequire } from 'node:module';
const { captures } = createRequire(import.meta.url)('../src/services/accountEmail.js');
let poster, tasker, admin, category;
const api = (user, path, body = {}) =>
  request(app)
    .post('/api/' + path)
    .set('Authorization', 'Bearer ' + user.token)
    .send(body);
async function task(amount = 10, hire = false) {
  const r = await api(poster, 'tasks', {
    title: 'Payment regression project',
    description: 'A clear brief for a payment regression.',
    budget: amount,
    categoryId: category.id,
    isRemote: true,
  });
  expect(r.status).toBe(201);
  const id = r.body.task.id;
  expect((await api(poster, `payments/tasks/${id}/fund`, { confirmPreview: true })).status).toBe(
    200,
  );
  if (hire) {
    const o = await api(tasker, `offers/task/${id}`, {
      amount,
      message: 'I can deliver the agreed result.',
    });
    expect(
      (await api(poster, `offers/${o.body.offer.id}/accept`, { confirmPreview: true })).status,
    ).toBe(200);
  }
  return id;
}
beforeAll(async () => {
  const login = async (email) =>
    (await request(app).post('/api/auth/login').send({ email, password: 'Password123!' })).body;
  poster = await login('sarah@example.com');
  tasker = await login('alex@example.com');
  admin = await login('admin@getitdone.com');
  category = await prisma.category.findFirst();
});
describe('Cent-based funding and settlement', () => {
  for (const [amount, total, net, fee, rate] of [
    [10, 1100, 882, 218, 2],
    [15, 1600, 1372, 228, 2],
    [49.99, 5099, 4801, 298, 2],
    [50, 5100, 4704, 396, 4],
    [99.99, 10099, 9503, 596, 4],
    [100, 10100, 9405, 695, 5],
  ]) {
    it(`quotes $${amount} accurately`, () =>
      expect(breakdown(cents(amount))).toMatchObject({
        posterTotalCents: total,
        taskerNetCents: net,
        platformFeeCents: fee,
        feeRate: rate,
      }));
  }
  it('rejects invalid amounts and fractional cents', () => {
    for (const amount of [1, 'NaN', Infinity, 10.001, 50001]) expect(() => cents(amount)).toThrow();
  });
  it('keeps drafts private and unpublished until confirmation', async () => {
    const r = await api(poster, 'tasks', {
      title: 'Unfunded private task',
      description: 'A draft which must never enter public search.',
      budget: 10,
      categoryId: category.id,
    });
    const id = r.body.task.id;
    expect((await request(app).get('/api/tasks/' + id)).status).toBe(404);
    expect(
      (await request(app).get('/api/tasks?status=ALL')).body.tasks.some((t) => t.id === id),
    ).toBe(false);
    expect((await api(tasker, `payments/tasks/${id}/fund`, { confirmPreview: true })).status).toBe(
      403,
    );
    expect((await api(poster, `payments/tasks/${id}/fund`)).status).toBe(400);
    expect((await prisma.task.findUnique({ where: { id } })).status).toBe('DRAFT');
  });
  it('funds only once under retries', async () => {
    const id = await task();
    expect((await api(poster, `payments/tasks/${id}/fund`, { confirmPreview: true })).status).toBe(
      200,
    );
    expect(await prisma.ledgerEntry.count({ where: { taskId: id, kind: 'FUND' } })).toBe(1);
  });
  it('settles changed offers before hiring and prevents funded price edits', async () => {
    const id = await task(15);
    const o = await api(tasker, `offers/task/${id}`, {
      amount: 10,
      message: 'A smaller agreed price for this task.',
    });
    expect((await api(poster, `offers/${o.body.offer.id}/accept`)).status).toBe(400);
    expect(
      (await api(poster, `offers/${o.body.offer.id}/accept`, { confirmPreview: true })).status,
    ).toBe(200);
    expect(
      (await prisma.ledgerEntry.findFirst({ where: { taskId: id, kind: 'PRICE_REFUND' } }))
        .amountCents,
    ).toBe(500);
    const changed = await request(app)
      .put('/api/tasks/' + id)
      .set('Authorization', 'Bearer ' + poster.token)
      .send({ budget: 30 });
    expect(changed.status).toBe(400);
  });
  it('requires delivery and jobber approval, then credits once', async () => {
    const id = await task(10, true);
    const before = await prisma.user.findUnique({ where: { id: tasker.user.id } });
    expect((await api(poster, `payments/tasks/${id}/release`)).status).toBe(409);
    expect(
      (
        await api(poster, `payments/tasks/${id}/deliver`, {
          notes: 'Trying to deliver as the poster.',
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await api(tasker, `payments/tasks/${id}/deliver`, {
          notes: 'Delivered the complete agreed project.',
        })
      ).status,
    ).toBe(200);
    expect((await api(tasker, `payments/tasks/${id}/release`)).status).toBe(403);
    expect((await api(poster, `payments/tasks/${id}/release`)).body.payoutAmount).toBe(8.82);
    expect((await api(poster, `payments/tasks/${id}/release`)).status).toBe(200);
    const after = await prisma.user.findUnique({ where: { id: tasker.user.id } });
    expect(after.walletBalanceCents - before.walletBalanceCents).toBe(882);
    expect(await prisma.ledgerEntry.count({ where: { taskId: id, kind: 'PAYOUT' } })).toBe(1);
  });
  it('handles competing release requests without duplicate credits', async () => {
    const id = await task(10, true);
    await api(tasker, `payments/tasks/${id}/deliver`, {
      notes: 'Delivery for concurrent approval regression.',
    });
    const results = await Promise.all([
      api(poster, `payments/tasks/${id}/release`),
      api(poster, `payments/tasks/${id}/release`),
    ]);
    expect(results.some((r) => r.status === 200)).toBe(true);
    expect(await prisma.ledgerEntry.count({ where: { taskId: id, kind: 'PAYOUT' } })).toBe(1);
  });
  for (const outcome of ['RELEASE', 'REFUND', 'SPLIT'])
    it(`freezes disputed funds until admin ${outcome}`, async () => {
      const id = await task(10, true);
      await api(tasker, `payments/tasks/${id}/deliver`, {
        notes: 'The worker believes all work is delivered.',
      });
      expect(
        (
          await api(poster, `payments/tasks/${id}/dispute`, {
            reason: 'The delivered result does not meet the agreed scope.',
          })
        ).status,
      ).toBe(200);
      expect(
        (
          await api(tasker, `payments/tasks/${id}/evidence`, {
            content: 'The delivery links show the completed agreed work.',
          })
        ).status,
      ).toBe(200);
      expect((await api(poster, `payments/tasks/${id}/release`)).status).toBe(409);
      expect(
        (
          await api(poster, `payments/admin/tasks/${id}/resolve`, {
            outcome,
            decision: 'Unauthorized resolution attempt.',
          })
        ).status,
      ).toBe(403);
      const body = {
        outcome,
        awardCents: 500,
        decision: 'Both parties were heard and the evidence was reviewed.',
      };
      const r = await api(admin, `payments/admin/tasks/${id}/resolve`, body);
      expect(r.status).toBe(200);
      if (outcome === 'REFUND') expect(r.body.refundAmount).toBe(11);
      if (outcome === 'SPLIT') {
        expect(r.body.refundAmount).toBe(5);
        expect(r.body.payoutAmount).toBe(3.92);
      }
      expect((await api(admin, `payments/admin/tasks/${id}/resolve`, body)).status).toBe(200);
      expect(
        await prisma.ledgerEntry.count({
          where: { taskId: id, kind: outcome === 'REFUND' ? 'REFUND' : 'PAYOUT' },
        }),
      ).toBe(1);
    });
  it('serializes offer revisions against hiring without changing an accepted agreement', async () => {
    const id = await task(10);
    const o = await api(tasker, `offers/task/${id}`, {
      amount: 10,
      message: 'The original proposed project scope.',
    });
    await Promise.all([
      api(tasker, `offers/task/${id}`, {
        amount: 20,
        message: 'A revised proposal before hiring is confirmed.',
      }),
      api(poster, `offers/${o.body.offer.id}/accept`, { confirmPreview: true }),
    ]);
    let current = await prisma.task.findUnique({
      where: { id },
      include: { offers: true, payment: true },
    });
    if (current.status === 'OPEN') {
      expect(
        (await api(poster, `offers/${o.body.offer.id}/accept`, { confirmPreview: true })).status,
      ).toBe(200);
      current = await prisma.task.findUnique({
        where: { id },
        include: { offers: true, payment: true },
      });
    }
    const accepted = current.offers.find((offer) => offer.id === current.assignedOfferId);
    expect(accepted.status).toBe('ACCEPTED');
    expect(current.payment.amountCents).toBe(Math.round(accepted.amount * 100));
    expect(
      (
        await api(tasker, `offers/task/${id}`, {
          amount: 30,
          message: 'Attempt to change the hired proposal.',
        })
      ).status,
    ).toBe(400);
    expect((await api(tasker, `offers/${accepted.id}/withdraw`)).status).toBe(400);
  });
  it('refunds all pre-hiring held funds and waives fees', async () => {
    const id = await task();
    const r = await api(poster, `payments/tasks/${id}/cancel`);
    expect(r.body.refundAmount).toBe(11);
    expect(await prisma.ledgerEntry.count({ where: { taskId: id, kind: 'PLATFORM_FEE' } })).toBe(0);
  });
  it('funds a legacy open task without removing its existing offers', async () => {
    const old = await prisma.task.create({
      data: {
        title: 'Existing unfunded task',
        description: 'Preserve this old post and fund it before hiring.',
        budget: 10,
        categoryId: category.id,
        posterId: poster.user.id,
        status: 'OPEN',
      },
    });
    const offer = await api(tasker, `offers/task/${old.id}`, {
      amount: 10,
      message: 'An offer for this existing marketplace task.',
    });
    expect(
      (await api(poster, `offers/${offer.body.offer.id}/accept`, { confirmPreview: true })).status,
    ).toBe(409);
    expect(
      (await api(poster, `payments/tasks/${old.id}/fund`, { confirmPreview: true })).status,
    ).toBe(200);
    expect(
      (await api(poster, `offers/${offer.body.offer.id}/accept`, { confirmPreview: true })).status,
    ).toBe(200);
  });
  it('caps small split awards and rejects evidence after settlement', async () => {
    const id = await task(100, true);
    await api(poster, `payments/tasks/${id}/dispute`, {
      reason: 'The parties disagree about the delivered scope.',
    });
    const r = await api(admin, `payments/admin/tasks/${id}/resolve`, {
      outcome: 'SPLIT',
      awardCents: 50,
      decision: 'A small portion of the work merits this award.',
    });
    expect(r.status).toBe(200);
    expect(r.body.payoutAmount).toBe(0);
    expect(r.body.refundAmount).toBe(99.5);
    expect(
      (
        await api(tasker, `payments/tasks/${id}/evidence`, {
          content: 'Late evidence must not modify a settled dispute.',
        })
      ).status,
    ).toBe(409);
  });
  it('reconciles legacy balances and payments without crediting them twice', async () => {
    const reconcile = createRequire(import.meta.url)('../scripts/reconcile-payments.cjs');
    const u = await prisma.user.create({
      data: {
        name: 'Legacy account',
        email: 'legacy-wallet@example.com',
        password: 'unused',
        walletBalance: 27.15,
        ratingCount: 99,
        ratingAvg: 5,
      },
    });
    const t = await prisma.task.create({
      data: {
        title: 'Legacy completed task',
        description: 'Legacy payment snapshot must remain unchanged.',
        budget: 10,
        categoryId: category.id,
        posterId: u.id,
        status: 'COMPLETED',
      },
    });
    await prisma.payment.create({
      data: { taskId: t.id, amount: 10, platformFee: 1, status: 'RELEASED' },
    });
    await reconcile();
    await reconcile();
    expect((await prisma.user.findUnique({ where: { id: u.id } })).walletBalanceCents).toBe(2715);
    expect(await prisma.payment.findUnique({ where: { taskId: t.id } })).toMatchObject({
      feeVersion: 'legacy',
      taskerNetCents: 900,
      posterTotalCents: 1000,
    });
    expect(await prisma.ledgerEntry.count({ where: { taskId: t.id } })).toBe(0);
    expect((await request(app).get('/api/users/' + u.id)).body.user.ratingCount).toBe(0);
  });
  it('protects administration and account history', async () => {
    expect(
      (
        await request(app)
          .get('/api/payments/admin')
          .set('Authorization', 'Bearer ' + tasker.token)
      ).status,
    ).toBe(403);
    const r = await request(app)
      .get('/api/payments/account')
      .set('Authorization', 'Bearer ' + tasker.token);
    expect(r.status).toBe(200);
    expect(r.body.entries.every((e) => e.userId === tasker.user.id)).toBe(true);
  });
});
describe('Account activation and recovery', () => {
  let email, token, user;
  it('registers pending and stores only a token hash', async () => {
    email = `activation-${Date.now()}@example.com`;
    const r = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Activation User', email, password: 'Original123!' });
    expect(r.status).toBe(201);
    expect(r.body.token).toBeUndefined();
    token = captures.find((m) => m.to === email).token;
    user = await prisma.user.findUnique({ where: { email } });
    expect(user.isEmailVerified).toBe(false);
    expect(user.emailVerifyToken).not.toBe(token);
    expect(
      (await request(app).post('/api/auth/login').send({ email, password: 'Original123!' })).status,
    ).toBe(403);
  });
  it('resend invalidates the old token and activation is single-use', async () => {
    await request(app).post('/api/auth/resend-verification').send({ email });
    expect((await request(app).post('/api/auth/verify-email').send({ token })).status).toBe(400);
    token = captures.filter((m) => m.to === email).at(-1).token;
    expect((await request(app).post('/api/auth/verify-email').send({ token })).status).toBe(200);
    expect((await request(app).post('/api/auth/verify-email').send({ token })).status).toBe(400);
  });
  it('reset revokes existing sessions and rejects replay', async () => {
    const old = (
      await request(app).post('/api/auth/login').send({ email, password: 'Original123!' })
    ).body.token;
    await request(app).post('/api/auth/forgot-password').send({ email });
    const reset = captures.filter((m) => m.to === email && m.kind === 'reset').at(-1).token;
    expect(
      (
        await request(app)
          .post('/api/auth/reset-password')
          .send({ token: reset, password: 'Replacement123!' })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer ' + old)
      ).status,
    ).toBe(401);
    expect(
      (
        await request(app)
          .post('/api/auth/reset-password')
          .send({ token: reset, password: 'Again123!' })
      ).status,
    ).toBe(400);
    expect(
      (await request(app).post('/api/auth/login').send({ email, password: 'Replacement123!' }))
        .status,
    ).toBe(200);
  });
  it('rejects expired reset tokens', async () => {
    await request(app).post('/api/auth/forgot-password').send({ email });
    const reset = captures.filter((m) => m.to === email && m.kind === 'reset').at(-1).token;
    await prisma.user.update({ where: { email }, data: { resetPasswordExpires: new Date(0) } });
    expect(
      (
        await request(app)
          .post('/api/auth/reset-password')
          .send({ token: reset, password: 'Replacement123!' })
      ).status,
    ).toBe(400);
  });
  it('rejects expired activation tokens', async () => {
    const address = 'expired-activation@example.com';
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Expired Activation', email: address, password: 'Password123!' });
    const link = captures.find((m) => m.to === address).token;
    await prisma.user.update({
      where: { email: address },
      data: { emailVerifyExpires: new Date(0) },
    });
    expect((await request(app).post('/api/auth/verify-email').send({ token: link })).status).toBe(
      400,
    );
  });
  it('does not claim success when email is unconfigured', async () => {
    const prev = process.env.EMAIL_TRANSPORT;
    process.env.EMAIL_TRANSPORT = '';
    try {
      expect(
        (
          await request(app)
            .post('/api/auth/register')
            .send({ name: 'No Email', email: 'no-delivery@example.com', password: 'Password123!' })
        ).status,
      ).toBe(503);
    } finally {
      process.env.EMAIL_TRANSPORT = prev;
    }
  });
});
