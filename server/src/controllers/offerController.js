const prisma = require('../config/prisma');
const marketplace = require('../services/marketplaceService');
const { cents } = require('../services/fees');

const createOffer = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { amount, message } = req.body;
    const price = cents(amount) / 100;
    const offer = await prisma.$transaction(async (db) => {
      const task = await db.task.findUnique({ where: { id: taskId } });
      if (!task) throw Object.assign(new Error('Task not found.'), { status: 404 });
      if (task.posterId === req.user.id)
        throw Object.assign(new Error('You cannot submit an offer on your own task.'), {
          status: 400,
        });
      // Serializes proposal edits against hiring and cancellation.
      const locked = await db.task.updateMany({
        where: { id: taskId, status: 'OPEN' },
        data: { status: 'OPEN' },
      });
      if (!locked.count)
        throw Object.assign(new Error('Cannot make an offer on a task that is no longer open.'), {
          status: 400,
        });
      const existing = await db.offer.findFirst({ where: { taskId, taskerId: req.user.id } });
      const include = {
        tasker: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isVerified: true,
            ratingAvg: true,
            ratingCount: true,
          },
        },
      };
      const result = existing
        ? await db.offer.update({
            where: { id: existing.id },
            data: { amount: price, message, status: 'PENDING' },
            include,
          })
        : await db.offer.create({
            data: { amount: price, message, taskId, taskerId: req.user.id },
            include,
          });
      await db.notification.create({
        data: {
          userId: task.posterId,
          type: 'OFFER_RECEIVED',
          title: 'New offer received',
          message: `${req.user.name} made an offer of $${price.toFixed(2)} on "${task.title}".`,
          link: `/tasks/${taskId}`,
        },
      });
      return result;
    });
    res.status(201).json({ message: 'Offer submitted successfully', offer });
  } catch (error) {
    next(error);
  }
};

const getTaskOffers = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const offers = await prisma.offer.findMany({
      where: { taskId },
      include: {
        tasker: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ offers });
  } catch (error) {
    next(error);
  }
};

const acceptOffer = async (req, res, next) => {
  try {
    const payment = await marketplace.hire(req.params.id, req.user, req.body);
    res.json({
      message: 'Offer accepted. Your tasker can now begin.',
      taskId: payment.taskId,
      escrowPayment: payment,
    });
  } catch (e) {
    next(e);
  }
};

const withdrawOffer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const offer = await prisma.offer.findUnique({ where: { id } });
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found.' });
    }

    if (offer.taskerId !== req.user.id) {
      return res.status(403).json({ message: 'You can only withdraw your own offer.' });
    }

    if (offer.status !== 'PENDING') {
      return res
        .status(400)
        .json({ message: 'Cannot withdraw an offer that is already accepted or rejected.' });
    }

    await prisma.$transaction(async (db) => {
      const locked = await db.task.updateMany({
        where: { id: offer.taskId, status: 'OPEN' },
        data: { status: 'OPEN' },
      });
      if (!locked.count)
        throw Object.assign(new Error('This task is no longer accepting offer changes.'), {
          status: 409,
        });
      const changed = await db.offer.updateMany({
        where: { id, taskerId: req.user.id, status: 'PENDING' },
        data: { status: 'WITHDRAWN' },
      });
      if (!changed.count)
        throw Object.assign(new Error('This offer has already changed.'), { status: 409 });
    });

    res.json({ message: 'Offer withdrawn successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOffer,
  getTaskOffers,
  acceptOffer,
  withdrawOffer,
};
