const prisma = require('../config/prisma');
const { provider } = require('./paymentService');
const { cents, breakdown, fail } = require('./fees');
const load = async (db, id) => {
  const task = await db.task.findUnique({
    where: { id },
    include: { payment: true, offers: true, dispute: true },
  });
  if (!task) throw fail(404, 'Task not found.');
  return task;
};
function participant(task, user) {
  if (
    user.id !== task.posterId &&
    !task.offers.some((o) => o.id === task.assignedOfferId && o.taskerId === user.id)
  )
    throw fail(403, 'Only task participants can perform this action.');
}
async function claim(db, task, from, to) {
  const changed = await db.task.updateMany({
    where: { id: task.id, status: { in: from } },
    data: { status: to },
  });
  if (changed.count !== 1) throw fail(409, 'The task changed. Refresh before continuing.');
}
async function entry(db, task, user, kind, amountCents, userId, suffix = '') {
  return db.ledgerEntry.create({
    data: {
      taskId: task.id,
      actorId: user.id,
      userId,
      kind,
      amountCents,
      key: `${task.id}:${kind}:${suffix}`,
    },
  });
}
async function fund(id, user, body) {
  if (body.confirmPreview !== true)
    throw fail(400, 'Confirm the payment preview. No actual charge occurs.');
  return prisma.$transaction(async (db) => {
    const task = await load(db, id);
    if (task.posterId !== user.id) throw fail(403, 'Only the jobber can fund this task.');
    if (task.status === 'OPEN' && task.payment) return task.payment;
    if (!['DRAFT', 'OPEN'].includes(task.status))
      throw fail(409, 'This task cannot be funded in its current state.');
    // Existing open tasks may predate funding; preserve them and require funding before hiring.
    await claim(db, task, [task.status], 'OPEN');
    const fees = breakdown(cents(task.budget));
    await provider.authorize({
      confirmPreview: body.confirmPreview,
      amountCents: fees.amountCents,
    });
    const payment = await db.payment.create({
      data: {
        taskId: id,
        amount: task.budget,
        platformFee: fees.platformFeeCents / 100,
        ...fees,
        status: 'HELD_IN_ESCROW',
      },
    });
    await entry(db, task, user, 'FUND', fees.posterTotalCents, task.posterId);
    return payment;
  });
}
async function hire(offerId, user, body) {
  return prisma.$transaction(async (db) => {
    let offer = await db.offer.findUnique({ where: { id: offerId } });
    if (!offer) throw fail(404, 'Offer not found.');
    const task = await load(db, offer.taskId);
    if (task.posterId !== user.id) throw fail(403, 'Only the jobber can select a tasker.');
    if (task.assignedOfferId === offerId) return task.payment;
    if (task.status !== 'OPEN' || offer.status !== 'PENDING')
      throw fail(409, 'This offer is no longer available.');
    if (!task.payment?.amountCents) throw fail(409, 'This task requires funding before hiring.');
    await claim(db, task, ['OPEN'], 'ASSIGNED');
    offer = await db.offer.findUnique({ where: { id: offerId } });
    if (offer.status !== 'PENDING') throw fail(409, 'This offer has already changed.');
    const fees =
      task.payment.feeVersion === 'legacy' && cents(offer.amount) === task.payment.amountCents
        ? {
            amountCents: task.payment.amountCents,
            posterTotalCents: task.payment.posterTotalCents,
            taskerNetCents: task.payment.taskerNetCents,
            platformFeeCents: task.payment.platformFeeCents,
            feeRate: task.payment.feeRate,
            feeVersion: 'legacy',
          }
        : breakdown(cents(offer.amount));
    const delta = fees.posterTotalCents - task.payment.posterTotalCents;
    if (delta && body.confirmPreview !== true)
      throw fail(400, 'Confirm the revised payment total before hiring.');
    await db.task.update({ where: { id: task.id }, data: { assignedOfferId: offer.id } });
    await db.offer.updateMany({
      where: { taskId: task.id, status: 'PENDING' },
      data: { status: 'REJECTED' },
    });
    await db.offer.update({ where: { id: offer.id }, data: { status: 'ACCEPTED' } });
    const payment = await db.payment.update({
      where: { taskId: task.id },
      data: {
        ...fees,
        amount: offer.amount,
        platformFee: fees.platformFeeCents / 100,
        revision: { increment: 1 },
      },
    });
    if (delta)
      await entry(
        db,
        task,
        user,
        delta > 0 ? 'TOP_UP' : 'PRICE_REFUND',
        Math.abs(delta),
        task.posterId,
      );
    await db.notification.create({
      data: {
        userId: offer.taskerId,
        type: 'OFFER_ACCEPTED',
        title: 'You have been hired',
        message: `Your offer for “${task.title}” was accepted. Agree on delivery details in your task conversation.`,
        link: `/tasks/${task.id}`,
      },
    });
    return payment;
  });
}
async function deliver(id, user, body) {
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  if (notes.length < 10 || notes.length > 3000)
    throw fail(400, 'Delivery notes must contain 10–3000 characters.');
  const attachments = body.attachments || [];
  if (
    !Array.isArray(attachments) ||
    attachments.length > 5 ||
    attachments.some((u) => typeof u !== 'string' || !/^https:\/\//.test(u) || u.length > 1000)
  )
    throw fail(400, 'Use up to five HTTPS delivery links.');
  return prisma.$transaction(async (db) => {
    const task = await load(db, id);
    if (!task.offers.some((o) => o.id === task.assignedOfferId && o.taskerId === user.id))
      throw fail(403, 'Only the hired tasker can deliver work.');
    if (task.status === 'DELIVERED')
      return db.delivery.findFirst({ where: { taskId: id }, orderBy: { createdAt: 'desc' } });
    if (task.status !== 'ASSIGNED') throw fail(409, 'This task is not awaiting delivery.');
    await claim(db, task, ['ASSIGNED'], 'DELIVERED');
    const delivery = await db.delivery.create({
      data: { taskId: id, authorId: user.id, notes, attachments: JSON.stringify(attachments) },
    });
    await db.notification.create({
      data: {
        userId: task.posterId,
        type: 'TASK_DELIVERED',
        title: 'Work ready for review',
        message: `Review the delivery for “${task.title}”.`,
        link: `/tasks/${id}`,
      },
    });
    return delivery;
  });
}
async function settle(db, task, user, awardCents) {
  const p = task.payment;
  if (!p?.amountCents || !['HELD_IN_ESCROW', 'DISPUTED'].includes(p.status))
    throw fail(409, 'No unsettled payment is available.');
  const offer = task.offers.find((o) => o.id === task.assignedOfferId);
  if (awardCents && !offer) throw fail(409, 'No hired tasker exists.');
  if (!Number.isInteger(awardCents) || awardCents < 0 || awardCents > p.amountCents)
    throw fail(400, 'Award must fit within the held task price.');
  const fees = awardCents
    ? p.feeVersion === 'legacy'
      ? {
          taskerNetCents:
            awardCents - Math.round((awardCents * p.platformFeeCents) / p.amountCents),
          platformFeeCents: Math.round((awardCents * p.platformFeeCents) / p.amountCents),
        }
      : breakdown(awardCents, p.feeRate)
    : { taskerNetCents: 0, platformFeeCents: 0 };
  const refund = awardCents ? p.amountCents - awardCents : p.posterTotalCents;
  const status = !awardCents
    ? 'REFUNDED'
    : awardCents === p.amountCents
      ? 'RELEASED'
      : 'PARTIALLY_SETTLED';
  const changed = await db.payment.updateMany({
    where: { id: p.id, revision: p.revision, status: p.status },
    data: {
      status,
      revision: { increment: 1 },
      taskerNetCents: fees.taskerNetCents,
      platformFeeCents: fees.platformFeeCents,
      platformFee: fees.platformFeeCents / 100,
    },
  });
  if (changed.count !== 1) throw fail(409, 'Payment has already changed.');
  if (awardCents) {
    await entry(db, task, user, 'PAYOUT', fees.taskerNetCents, offer.taskerId);
    await entry(db, task, user, 'PLATFORM_FEE', fees.platformFeeCents, null);
    await db.user.update({
      where: { id: offer.taskerId },
      data: {
        walletBalanceCents: { increment: fees.taskerNetCents },
        walletBalance: { increment: fees.taskerNetCents / 100 },
      },
    });
    await db.notification.create({
      data: {
        userId: offer.taskerId,
        type: 'TASK_COMPLETED',
        title: 'Payment released',
        message: `$${(fees.taskerNetCents / 100).toFixed(2)} was credited to your account for “${task.title}”.`,
        link: `/tasks/${task.id}`,
      },
    });
  }
  if (refund) await entry(db, task, user, 'REFUND', refund, task.posterId);
  await db.task.update({
    where: { id: task.id },
    data: { status: awardCents ? 'COMPLETED' : 'CANCELLED' },
  });
  return { payoutAmount: fees.taskerNetCents / 100, refundAmount: refund / 100, status };
}
async function release(id, user) {
  return prisma.$transaction(async (db) => {
    const task = await load(db, id);
    if (task.posterId !== user.id) throw fail(403, 'Only the jobber can approve delivery.');
    if (task.status === 'COMPLETED')
      return { payoutAmount: task.payment?.taskerNetCents / 100, status: task.payment?.status };
    if (task.status !== 'DELIVERED')
      throw fail(409, 'A tasker delivery is required before approval. Disputed funds remain held.');
    await claim(db, task, ['DELIVERED'], 'COMPLETED');
    return settle(db, task, user, task.payment.amountCents);
  });
}
async function dispute(id, user, body) {
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (reason.length < 10 || reason.length > 3000)
    throw fail(400, 'Explain the dispute in 10–3000 characters.');
  return prisma.$transaction(async (db) => {
    const task = await load(db, id);
    participant(task, user);
    if (task.dispute) return task.dispute;
    if (!['ASSIGNED', 'DELIVERED'].includes(task.status))
      throw fail(409, 'Only hired tasks can be disputed.');
    await claim(db, task, ['ASSIGNED', 'DELIVERED'], 'DISPUTED');
    await db.payment.update({
      where: { taskId: id },
      data: { status: 'DISPUTED', revision: { increment: 1 } },
    });
    return db.dispute.create({ data: { taskId: id, openedBy: user.id, reason } });
  });
}
async function evidence(id, user, body) {
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (content.length < 10 || content.length > 5000)
    throw fail(400, 'Evidence must contain 10–5000 characters.');
  return prisma.$transaction(async (db) => {
    const task = await load(db, id);
    participant(task, user);
    if (task.status !== 'DISPUTED' || task.dispute?.status !== 'OPEN')
      throw fail(409, 'There is no open dispute.');
    // Lock the task row against a concurrent settlement before recording evidence.
    await claim(db, task, ['DISPUTED'], 'DISPUTED');
    return db.disputeEvidence.create({
      data: { disputeId: task.dispute.id, authorId: user.id, content },
    });
  });
}
async function resolve(id, user, body) {
  if (user.role !== 'ADMIN') throw fail(403, 'Administrator access required.');
  const decision = typeof body.decision === 'string' ? body.decision.trim() : '';
  if (decision.length < 10 || decision.length > 3000)
    throw fail(400, 'A written decision of 10–3000 characters is required.');
  if (!['RELEASE', 'REFUND', 'SPLIT'].includes(body.outcome))
    throw fail(400, 'Choose release, refund or split.');
  return prisma.$transaction(async (db) => {
    const task = await load(db, id);
    if (task.dispute?.status === 'RESOLVED') return task.dispute;
    if (task.status !== 'DISPUTED') throw fail(409, 'This task has no open dispute.');
    const award =
      body.outcome === 'RELEASE'
        ? task.payment.amountCents
        : body.outcome === 'REFUND'
          ? 0
          : body.awardCents;
    if (
      body.outcome === 'SPLIT' &&
      (!Number.isInteger(award) || award <= 0 || award >= task.payment.amountCents)
    )
      throw fail(400, 'A split award must be between zero and the full task price.');
    await claim(db, task, ['DISPUTED'], award ? 'COMPLETED' : 'CANCELLED');
    const result = await settle(db, task, user, award);
    await db.dispute.update({
      where: { taskId: id },
      data: {
        status: 'RESOLVED',
        outcome: body.outcome,
        decision,
        decidedBy: user.id,
        awardCents: award,
        resolvedAt: new Date(),
      },
    });
    return result;
  });
}
async function cancel(id, user) {
  return prisma.$transaction(async (db) => {
    const task = await load(db, id);
    participant(task, user);
    if (task.status === 'CANCELLED') return { status: 'REFUNDED' };
    if (['DRAFT', 'OPEN'].includes(task.status)) {
      if (task.posterId !== user.id) throw fail(403, 'Only the jobber can cancel an open task.');
      await claim(db, task, [task.status], 'CANCELLED');
      return task.payment ? settle(db, task, user, 0) : { status: 'CANCELLED' };
    }
    throw fail(409, 'After hiring, open a dispute to request cancellation and platform review.');
  });
}
module.exports = { fund, hire, deliver, release, dispute, evidence, resolve, cancel };
