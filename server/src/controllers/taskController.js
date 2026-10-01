const prisma = require('../config/prisma');
const { captureEscrowPayment } = require('../services/paymentService');
const { uploadToStorage } = require('../services/storageService');

const maskAddress = (address) => {
  if (!address || typeof address !== 'string') return address;
  // Strip street numbers to protect homeowner/poster privacy on public listings
  const masked = address.replace(/^\s*(?:(?:Unit|Apt|Suite|Lot|#)\s*[\w-]+\s*,?\s*)?\d+[-\d\/]*\s+/i, '');
  return masked.trim() || address;
};

const sanitizeTaskForViewer = (task, viewerId, viewerRole) => {
  if (!task) return task;

  // Exact coordinates and addresses are granted only to poster, admin, and accepted tasker
  const isPoster = viewerId && task.posterId === viewerId;
  const isAdmin = viewerRole === 'ADMIN';

  let isAssignedTasker = false;
  if (viewerId && (task.status === 'ASSIGNED' || task.status === 'COMPLETED')) {
    if (task.offers && Array.isArray(task.offers)) {
      isAssignedTasker = task.offers.some(
        (o) => (o.status === 'ACCEPTED' || o.id === task.assignedOfferId) && o.taskerId === viewerId
      );
    }
  }

  if (isPoster || isAdmin || isAssignedTasker) {
    return task;
  }

  const sanitized = { ...task };
  if (sanitized.latitude !== null && sanitized.latitude !== undefined) {
    sanitized.latitude = Number(Number(sanitized.latitude).toFixed(2));
  }
  if (sanitized.longitude !== null && sanitized.longitude !== undefined) {
    sanitized.longitude = Number(Number(sanitized.longitude).toFixed(2));
  }
  if (sanitized.location) {
    sanitized.location = maskAddress(sanitized.location);
  }

  // Strip internal foreign keys and metadata from public view
  delete sanitized.assignedOfferId;
  delete sanitized.categoryId;
  delete sanitized.payment;

  // Format dueDate to date-only to avoid leaking exact microsecond timing
  if (sanitized.dueDate instanceof Date) {
    sanitized.dueDate = sanitized.dueDate.toISOString().split('T')[0];
  }

  // Strip sensitive poster profile data
  if (sanitized.poster) {
    sanitized.poster = {
      id: sanitized.poster.id,
      name: sanitized.poster.name,
      avatar: sanitized.poster.avatar,
      isVerified: sanitized.poster.isVerified,
      ratingAvg: sanitized.poster.ratingAvg,
      ratingCount: sanitized.poster.ratingCount,
    };
  }

  return sanitized;
};

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

    // 1. Strict Pagination Bounds Validation
    let parsedPage = 1;
    if (page !== undefined && page !== '') {
      parsedPage = Number(page);
      if (!Number.isInteger(parsedPage) || parsedPage < 1) {
        return res.status(400).json({
          code: 'INVALID_PAGINATION',
          message: 'Query parameter "page" must be a positive integer greater than or equal to 1.',
        });
      }
    }

    let parsedLimit = 20;
    if (limit !== undefined && limit !== '') {
      parsedLimit = Number(limit);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          code: 'INVALID_LIMIT',
          message: 'Query parameter "limit" must be an integer between 1 and 100.',
        });
      }
    }

    const where = {};

    // 2. Strict Filter Validations
    const validStatuses = ['ALL', 'OPEN', 'ASSIGNED', 'COMPLETED', 'CANCELLED'];
    if (status !== undefined && status !== '') {
      const normalizedStatus = String(status).trim().toUpperCase();
      if (!validStatuses.includes(normalizedStatus)) {
        return res.status(400).json({
          code: 'INVALID_STATUS',
          message: `Invalid status filter "${status}". Allowed values: ${validStatuses.join(', ')}`,
        });
      }
      if (normalizedStatus !== 'ALL') {
        where.status = normalizedStatus;
      }
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

    if (minBudget !== undefined && minBudget !== '') {
      const parsedMin = Number(minBudget);
      if (isNaN(parsedMin) || parsedMin < 0) {
        return res.status(400).json({
          code: 'INVALID_BUDGET',
          message: 'Query parameter "minBudget" must be a non-negative number.',
        });
      }
      where.budget = where.budget || {};
      where.budget.gte = parsedMin;
    }

    if (maxBudget !== undefined && maxBudget !== '') {
      const parsedMax = Number(maxBudget);
      if (isNaN(parsedMax) || parsedMax < 0) {
        return res.status(400).json({
          code: 'INVALID_BUDGET',
          message: 'Query parameter "maxBudget" must be a non-negative number.',
        });
      }
      where.budget = where.budget || {};
      where.budget.lte = parsedMax;
    }

    if (where.budget?.gte !== undefined && where.budget?.lte !== undefined && where.budget.gte > where.budget.lte) {
      return res.status(400).json({
        code: 'INVALID_BUDGET_RANGE',
        message: 'minBudget cannot exceed maxBudget.',
      });
    }

    // 3. Strict Sort & Order Validation
    const validSortFields = ['createdAt', 'budget', 'dueDate', 'title'];
    if (sortBy && !validSortFields.includes(sortBy)) {
      return res.status(400).json({
        code: 'INVALID_SORT_BY',
        message: `Invalid sortBy "${sortBy}". Allowed values: ${validSortFields.join(', ')}`,
      });
    }

    const normalizedOrder = String(order || 'desc').toLowerCase();
    if (!['asc', 'desc'].includes(normalizedOrder)) {
      return res.status(400).json({
        code: 'INVALID_ORDER',
        message: 'Query parameter "order" must be "asc" or "desc".',
      });
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const skip = (parsedPage - 1) * parsedLimit;
    const take = parsedLimit;

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
          [sortBy]: normalizedOrder === 'asc' ? 'asc' : 'desc',
        },
        skip,
        take,
      }),
      prisma.task.count({ where }),
    ]);

    const sanitizedTasks = tasks.map((t) => sanitizeTaskForViewer(t, req.user?.id, req.user?.role));

    const pages = total === 0 ? 1 : Math.ceil(total / take);

    res.json({
      tasks: sanitizedTasks,
      pagination: {
        total,
        page: parsedPage,
        pages,
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

    const sanitizedTask = sanitizeTaskForViewer(task, req.user?.id, req.user?.role);

    res.json({ task: sanitizedTask });
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
