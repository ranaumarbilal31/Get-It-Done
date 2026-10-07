const router = require('express').Router();
const prisma = require('../config/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const service = require('../services/marketplaceService');
const { cents, breakdown } = require('../services/fees');
const action = (name) => async (req, res, next) => {
  try {
    res.json(await service[name](req.params.id, req.user, req.body));
  } catch (e) {
    next(e);
  }
};
router.use(authenticate);
router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
router.get('/quote', (req, res, next) => {
  try {
    res.json(breakdown(cents(req.query.amount)));
  } catch (e) {
    next(e);
  }
});
router.get('/account', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { walletBalanceCents: true },
    });
    const entries = await prisma.ledgerEntry.findMany({
      where: { userId: req.user.id },
      include: { task: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { posterId: req.user.id },
          { offers: { some: { taskerId: req.user.id, status: 'ACCEPTED' } } },
        ],
      },
      include: { payment: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ balanceCents: user.walletBalanceCents, entries, tasks });
  } catch (e) {
    next(e);
  }
});
for (const [path, name] of [
  ['fund', 'fund'],
  ['deliver', 'deliver'],
  ['release', 'release'],
  ['dispute', 'dispute'],
  ['evidence', 'evidence'],
  ['cancel', 'cancel'],
])
  router.post('/tasks/:id/' + path, action(name));
router.get('/admin', requireAdmin, async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        task: {
          include: {
            dispute: { include: { evidence: true } },
            deliveries: true,
            ledger: true,
            poster: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    const totals = await prisma.ledgerEntry.groupBy({ by: ['kind'], _sum: { amountCents: true } });
    const held = await prisma.payment.aggregate({
      where: { status: { in: ['HELD_IN_ESCROW', 'DISPUTED'] } },
      _sum: { posterTotalCents: true },
    });
    res.json({ payments, totals, heldCents: held._sum.posterTotalCents || 0 });
  } catch (e) {
    next(e);
  }
});
router.post('/admin/tasks/:id/resolve', requireAdmin, action('resolve'));
module.exports = router;
