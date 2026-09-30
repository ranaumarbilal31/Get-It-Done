const prisma = require('../config/prisma');

const createReview = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { rating, comment } = req.body;

    const numericRating = parseInt(rating, 10);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Please write a review comment.' });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        offers: { where: { status: 'ACCEPTED' } },
        review: true,
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (task.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Reviews can only be submitted for completed tasks.' });
    }

    if (task.review) {
      return res.status(400).json({ message: 'A review has already been submitted for this task.' });
    }

    const acceptedOffer = task.offers[0];
    if (!acceptedOffer) {
      return res.status(400).json({ message: 'No accepted offer found for this task.' });
    }

    // Determine reviewer and reviewee
    let revieweeId;
    if (req.user.id === task.posterId) {
      revieweeId = acceptedOffer.taskerId;
    } else if (req.user.id === acceptedOffer.taskerId) {
      revieweeId = task.posterId;
    } else {
      return res.status(403).json({ message: 'Only participants in this task can leave a review.' });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        taskId,
        reviewerId: req.user.id,
        revieweeId,
        rating: numericRating,
        comment: comment.trim(),
      },
      include: {
        reviewer: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Recalculate average rating for reviewee
    const allReviews = await prisma.review.findMany({
      where: { revieweeId },
      select: { rating: true },
    });

    const totalRatings = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const ratingAvg = parseFloat((totalRatings / allReviews.length).toFixed(1));

    await prisma.user.update({
      where: { id: revieweeId },
      data: {
        ratingAvg,
        ratingCount: allReviews.length,
      },
    });

    // Notify reviewee
    await prisma.notification.create({
      data: {
        userId: revieweeId,
        type: 'SYSTEM',
        title: 'New Review Received! ⭐',
        message: `${req.user.name} gave you a ${numericRating}-star review for "${task.title}".`,
        link: `/users/${revieweeId}`,
      },
    });

    res.status(201).json({
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
};

const getUserReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: {
          select: { id: true, name: true, avatar: true },
        },
        task: {
          select: { id: true, title: true, budget: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ reviews });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getUserReviews,
};
