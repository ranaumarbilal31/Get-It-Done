const path = require('path');
const fs = require('fs');
const prisma = require('../config/prisma');

const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalTasks,
      completedTasks,
      assignedTasks,
      openTasks,
      pendingVerifications,
      payments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'COMPLETED' } }),
      prisma.task.count({ where: { status: 'ASSIGNED' } }),
      prisma.task.count({ where: { status: 'OPEN' } }),
      prisma.user.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.payment.findMany({ select: { amount: true, status: true, platformFee: true } }),
    ]);

    const escrowHeld = payments
      .filter((p) => p.status === 'HELD_IN_ESCROW')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalReleased = payments
      .filter((p) => p.status === 'RELEASED')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalPlatformFees = payments
      .filter((p) => p.status === 'RELEASED')
      .reduce((sum, p) => sum + p.platformFee, 0);

    res.json({
      stats: {
        totalUsers,
        totalTasks,
        completedTasks,
        assignedTasks,
        openTasks,
        pendingVerifications,
        escrowHeld,
        totalReleased,
        totalPlatformFees,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { search, role, verificationStatus, page = 1, limit = 20 } = req.query;

    const where = {};
    if (search) {
      where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
    }
    if (role) where.role = role;
    if (verificationStatus) where.verificationStatus = verificationStatus;

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

    const skip = (parsedPage - 1) * parsedLimit;
    const take = parsedLimit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          isVerified: true,
          verificationStatus: true,
          ratingAvg: true,
          ratingCount: true,
          createdAt: true,
          _count: {
            select: {
              tasksPosted: true,
              offers: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: parsedPage,
        pages: Math.ceil(total / take),
        limit: take,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getPendingVerifications = async (req, res, next) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { verificationStatus: 'PENDING' },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        verificationStatus: true,
        verificationNotes: true,
        createdAt: true,
        idDocument: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const sanitizedUsers = pendingUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      verificationStatus: u.verificationStatus,
      verificationNotes: u.verificationNotes,
      createdAt: u.createdAt,
      // Provide authorized document route instead of leaking raw storage links
      idDocument: u.idDocument ? `/api/admin/verifications/${u.id}/document` : null,
    }));

    res.json({ pendingUsers: sanitizedUsers });
  } catch (error) {
    next(error);
  }
};

const getVerificationDocument = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, idDocument: true },
    });

    if (!user || !user.idDocument) {
      return res
        .status(404)
        .json({ code: 'NOT_FOUND', message: 'No verification document found for this user.' });
    }

    if (user.idDocument.startsWith('http://') || user.idDocument.startsWith('https://')) {
      return res.redirect(user.idDocument);
    }

    res.set('Cache-Control', 'no-store');
    const data = user.idDocument.match(
      /^data:(image\/(?:png|jpeg|webp|gif)|application\/pdf);base64,([A-Za-z0-9+/=]+)$/,
    );
    if (data) return res.type(data[1]).send(Buffer.from(data[2], 'base64'));
    const uploadRoot = path.resolve(__dirname, '../../uploads');
    const filePath = user.idDocument.startsWith('/uploads/')
      ? path.join(uploadRoot, path.basename(user.idDocument))
      : path.resolve(user.idDocument);
    if (!filePath.startsWith(uploadRoot + path.sep))
      return res.status(404).json({ message: 'Document unavailable.' });
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ code: 'NOT_FOUND', message: 'Document file not found on disk.' });
    }

    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

const updateVerificationStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, notes } = req.body; // status: 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Status must be APPROVED or REJECTED.' });
    }

    const isVerified = status === 'APPROVED';

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified,
        verificationStatus: status,
        verificationNotes: notes || (isVerified ? 'ID approved by Admin' : 'ID rejected by Admin'),
      },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        verificationStatus: true,
      },
    });

    // Create Notification for user
    await prisma.notification.create({
      data: {
        userId,
        type: 'VERIFICATION',
        title: isVerified ? 'ID Verified! 🛡️' : 'ID Verification Update',
        message: isVerified
          ? 'Congratulations! Your identity document has been verified. You now display the Verified Tasker badge!'
          : `Your identity verification was rejected. Reason: ${notes || 'Document unreadable or invalid'}`,
        link: '/profile',
      },
    });

    res.json({
      message: `User verification updated to ${status}.`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

const toggleUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Role must be USER or ADMIN.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({ message: 'User role updated successfully.', user: updatedUser });
  } catch (error) {
    next(error);
  }
};

const getDetailedHealth = async (req, res, next) => {
  try {
    let dbStatus = 'healthy';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      dbStatus = 'unreachable';
    }

    res.json({
      status: 'ok',
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.3.0',
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getUsers,
  getPendingVerifications,
  getVerificationDocument,
  updateVerificationStatus,
  toggleUserRole,
  getDetailedHealth,
};
