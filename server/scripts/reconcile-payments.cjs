const prisma = require('../src/config/prisma');
async function reconcile() {
  // Preserve legacy balances and fee snapshots. Never credit an old payout again.
  const users = await prisma.user.findMany({
    where: { walletBalanceCents: 0, walletBalance: { not: 0 } },
  });
  for (const u of users)
    await prisma.user.updateMany({
      where: { id: u.id, walletBalanceCents: 0, walletBalance: u.walletBalance },
      data: { walletBalanceCents: Math.round(u.walletBalance * 100) },
    });
  const payments = await prisma.payment.findMany({ where: { amountCents: 0 } });
  for (const p of payments) {
    const amountCents = Math.round(p.amount * 100),
      platformFeeCents = Math.round(p.platformFee * 100);
    await prisma.payment.updateMany({
      where: { id: p.id, amountCents: 0 },
      data: {
        amountCents,
        posterTotalCents: amountCents,
        taskerNetCents: Math.max(0, amountCents - platformFeeCents),
        platformFeeCents,
        feeRate: 10,
        feeVersion: 'legacy',
        provider: 'preview',
      },
    });
  }
  // Public ratings must reflect recorded reviews, including on older accounts.
  const allUsers = await prisma.user.findMany({
    select: { id: true, ratingCount: true, ratingAvg: true },
  });
  const ratings = await prisma.review.groupBy({
    by: ['revieweeId'],
    _avg: { rating: true },
    _count: { rating: true },
  });
  const byUser = new Map(ratings.map((r) => [r.revieweeId, r]));
  for (const u of allUsers) {
    const r = byUser.get(u.id),
      ratingCount = r?._count.rating || 0,
      ratingAvg = r?._avg.rating || 0;
    if (u.ratingCount !== ratingCount || u.ratingAvg !== ratingAvg) {
      await prisma.user.updateMany({
        where: { id: u.id, ratingCount: u.ratingCount, ratingAvg: u.ratingAvg },
        data: { ratingCount, ratingAvg },
      });
    }
  }
  return { balances: users.length, payments: payments.length };
}
if (require.main === module)
  reconcile()
    .then(console.log)
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
module.exports = reconcile;
