const router = require('express').Router();
const prisma = require('../config/prisma');
router.get('/:id/completed', async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    if (!Number.isInteger(page) || page < 1)
      return res.status(400).json({ message: 'Invalid page.' });
    const where = {
      status: 'COMPLETED',
      offers: { some: { taskerId: req.params.id, status: 'ACCEPTED' } },
    };
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        select: { id: true, title: true, updatedAt: true, category: { select: { name: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * 10,
        take: 10,
      }),
      prisma.task.count({ where }),
    ]);
    res.json({ tasks, total, page, pages: Math.max(1, Math.ceil(total / 10)) });
  } catch (e) {
    next(e);
  }
});
router.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        isVerified: true,
        ratingAvg: true,
        ratingCount: true,
        createdAt: true,
      },
    });
    if (!user)
      return res.status(404).json({ code: 'NOT_FOUND', message: 'This profile does not exist.' });
    const completedCount = await prisma.task.count({
      where: { status: 'COMPLETED', offers: { some: { taskerId: user.id, status: 'ACCEPTED' } } },
    });
    const ratings = await prisma.review.aggregate({
      where: { revieweeId: user.id },
      _avg: { rating: true },
      _count: true,
    });
    res.json({
      user: {
        ...user,
        ratingAvg: ratings._avg.rating || 0,
        ratingCount: ratings._count,
        completedCount,
      },
    });
  } catch (error) {
    next(error);
  }
});
module.exports = router;
