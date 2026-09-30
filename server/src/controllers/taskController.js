const prisma = require('../config/prisma');
const { captureEscrowPayment } = require('../services/paymentService');
const { uploadToStorage } = require('../services/storageService');

const getTasks = async (req, res, next) => {
  try {
    const {
      search,
      category,
      status,
      minBudget,
      maxBudget,
      isRemote,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (category && category !== 'all') {
      where.OR = [
        { categoryId: category },
        { category: { slug: category } },
      ];
    }

    if (isRemote !== undefined && isRemote !== '') {
      where.isRemote = isRemote === 'true';
    }

    if (minBudget || maxBudget) {
      where.budget = {};
      if (minBudget) where.budget.gte = parseFloat(minBudget);
      if (maxBudget) where.budget.lte = parseFloat(maxBudget);
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          poster: {
            select: {
              id: true,
              name: true,
              avatar: true,
              isVerified: true,
              ratingAvg: true,
              ratingCount: true,
            },
          },
          category: true,
          _count: {
            select: { offers: true },
          },
        },
        orderBy: {
          [sortBy]: order === 'asc' ? 'asc' : 'desc',
        },
        skip,
        take,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      tasks,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / take),
        limit: take,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        poster: {
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
        category: true,
        offers: {
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
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        payment: true,
        review: {
          include: {
            reviewer: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    res.json({ task });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      budget,
      categoryId,
      location,
      latitude,
      longitude,
      isRemote,
      dueDate,
    } = req.body;

    let imagesArray = [];
    if (req.files && req.files.length > 0) {
      imagesArray = await Promise.all(req.files.map(uploadToStorage));
    } else if (req.body.images) {
      try {
        imagesArray = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
      } catch (e) {
        imagesArray = [req.body.images];
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        budget: parseFloat(budget),
        categoryId,
        location: isRemote === 'true' || isRemote === true ? 'Remote / Online' : (location || 'Location upon acceptance'),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        isRemote: isRemote === 'true' || isRemote === true,
        dueDate: dueDate ? new Date(dueDate) : null,
        images: JSON.stringify(imagesArray),
        posterId: req.user.id,
      },
      include: {
        poster: {
          select: { id: true, name: true, avatar: true, isVerified: true },
        },
        category: true,
      },
    });

    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (task.posterId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'You are not authorized to edit this task.' });
    }

    if (task.status !== 'OPEN' && req.user.role !== 'ADMIN') {
      return res.status(400).json({ message: 'Cannot modify a task that is already assigned or completed.' });
    }

    const { title, description, budget, categoryId, location, isRemote, dueDate } = req.body;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(budget !== undefined && { budget: parseFloat(budget) }),
        ...(categoryId && { categoryId }),
        ...(location && { location }),
        ...(isRemote !== undefined && { isRemote: isRemote === 'true' || isRemote === true }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
      },
      include: {
        category: true,
        poster: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    next(error);
  }
};

const completeTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        payment: true,
        offers: {
          where: { status: 'ACCEPTED' },
          include: { tasker: true },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (task.posterId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only the poster or an administrator can mark this task complete and release funds.' });
    }

    if (task.status !== 'ASSIGNED') {
      return res.status(400).json({ message: `Cannot complete task with status: ${task.status}. Task must be ASSIGNED.` });
    }

    const acceptedOffer = task.offers[0];
    if (!acceptedOffer) {
      return res.status(400).json({ message: 'No accepted offer found for this task.' });
    }

    const payoutAmount = task.payment ? (task.payment.amount - task.payment.platformFee) : acceptedOffer.amount;

    await prisma.$transaction([
      prisma.task.update({
        where: { id },
        data: { status: 'COMPLETED' },
      }),
      ...(task.payment
        ? [
            prisma.payment.update({
              where: { taskId: id },
              data: { status: 'RELEASED' },
            }),
          ]
        : []),
      prisma.user.update({
        where: { id: acceptedOffer.taskerId },
        data: {
          walletBalance: { increment: payoutAmount },
        },
      }),
      prisma.notification.create({
        data: {
          userId: acceptedOffer.taskerId,
          type: 'TASK_COMPLETED',
          title: 'Payment Released!',
          message: `Your work on "${task.title}" was completed! $${payoutAmount.toFixed(2)} has been credited to your wallet balance.`,
          link: `/tasks/${task.id}`,
        },
      }),
    ]);

    res.json({
      message: 'Task completed successfully! Funds released from escrow.',
      payoutAmount,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (task.posterId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'You are not authorized to delete this task.' });
    }

    await prisma.task.delete({ where: { id } });

    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
};
