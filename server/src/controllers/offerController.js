const prisma = require('../config/prisma');
const { sendOfferNotificationEmail, sendOfferAcceptedEmail } = require('../services/emailService');
const { createPaymentIntent } = require('../services/paymentService');

const createOffer = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { amount, message } = req.body;

    if (!amount || !message) {
      return res.status(400).json({ message: 'Please provide both an offer amount and a proposal message.' });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { poster: true },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (task.status !== 'OPEN') {
      return res.status(400).json({ message: 'Cannot make an offer on a task that is no longer open.' });
    }

    if (task.posterId === req.user.id) {
      return res.status(400).json({ message: 'You cannot submit an offer on your own task.' });
    }

    // Check if user already submitted an offer
    const existingOffer = await prisma.offer.findFirst({
      where: {
        taskId,
        taskerId: req.user.id,
      },
    });

    let offer;
    if (existingOffer) {
      // Update existing offer
      offer = await prisma.offer.update({
        where: { id: existingOffer.id },
        data: {
          amount: parseFloat(amount),
          message,
          status: 'PENDING',
        },
        include: {
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
        },
      });
    } else {
      // Create new offer
      offer = await prisma.offer.create({
        data: {
          amount: parseFloat(amount),
          message,
          taskId,
          taskerId: req.user.id,
        },
        include: {
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
        },
      });
    }

    // Create Notification for the Poster
    await prisma.notification.create({
      data: {
        userId: task.posterId,
        type: 'OFFER_RECEIVED',
        title: 'New Offer Received!',
        message: `${req.user.name} made an offer of $${parseFloat(amount).toFixed(2)} on "${task.title}".`,
        link: `/tasks/${taskId}`,
      },
    });

    // Send email notification (async)
    sendOfferNotificationEmail(task.poster.email, task.title, req.user.name, amount).catch(console.error);

    res.status(201).json({
      message: 'Offer submitted successfully',
      offer,
    });
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
    const { id } = req.params; // offer id

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        task: {
          include: { poster: true },
        },
        tasker: true,
      },
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found.' });
    }

    if (offer.task.posterId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only the task poster can accept an offer.' });
    }

    if (offer.task.status !== 'OPEN') {
      return res.status(400).json({ message: 'This task is already assigned or completed.' });
    }

    const platformFee = parseFloat((offer.amount * 0.1).toFixed(2)); // 10% platform fee
    const paymentIntent = await createPaymentIntent(offer.amount, offer.taskId, offer.task.posterId);

    // Atomically accept offer, reject other offers, update task status, and create escrow payment
    await prisma.$transaction([
      prisma.offer.update({
        where: { id },
        data: { status: 'ACCEPTED' },
      }),
      prisma.offer.updateMany({
        where: {
          taskId: offer.taskId,
          id: { not: id },
        },
        data: { status: 'REJECTED' },
      }),
      prisma.task.update({
        where: { id: offer.taskId },
        data: {
          status: 'ASSIGNED',
          assignedOfferId: id,
        },
      }),
      prisma.payment.create({
        data: {
          taskId: offer.taskId,
          amount: offer.amount,
          platformFee,
          status: 'HELD_IN_ESCROW',
          stripePaymentIntentId: paymentIntent.id,
        },
      }),
      prisma.notification.create({
        data: {
          userId: offer.taskerId,
          type: 'OFFER_ACCEPTED',
          title: 'Offer Accepted! 🎉',
          message: `${offer.task.poster.name} accepted your offer for "${offer.task.title}". Payment is secured in Escrow.`,
          link: `/tasks/${offer.taskId}`,
        },
      }),
    ]);

    // Send email to tasker
    sendOfferAcceptedEmail(offer.tasker.email, offer.task.title, offer.task.poster.name).catch(console.error);

    res.json({
      message: 'Offer accepted! Payment held securely in Platform Escrow.',
      taskId: offer.taskId,
      escrowPayment: {
        amount: offer.amount,
        platformFee,
        status: 'HELD_IN_ESCROW',
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (error) {
    next(error);
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
      return res.status(400).json({ message: 'Cannot withdraw an offer that is already accepted or rejected.' });
    }

    await prisma.offer.update({
      where: { id },
      data: { status: 'WITHDRAWN' },
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
