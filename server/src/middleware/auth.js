const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies) {
      token = req.cookies.getitdone_token || req.cookies.taskconnect_token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'getitdone_dev_secret_key_change_in_production_998877',
    );

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        phone: true,
        isVerified: true,
        verificationStatus: true,
        walletBalance: true,
        ratingAvg: true,
        ratingCount: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'User belonging to this token no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token authentication failed.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies) {
      token = req.cookies.getitdone_token || req.cookies.taskconnect_token;
    }
    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'getitdone_dev_secret_key_change_in_production_998877',
      );
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true, role: true, avatar: true },
      });
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (err) {
    next();
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  }
  next();
};

/**
 * KYC Submission Eligibility Guard:
 * Ensures authorization and eligibility checks occur BEFORE any file upload processing.
 * - Posters and Admins are rejected with HTTP 403 (ROLE_INELIGIBLE)
 * - Already verified users are rejected with HTTP 400 (ALREADY_VERIFIED)
 * - Users with pending submissions are rejected with HTTP 400 (VERIFICATION_PENDING)
 */
const requireKYCEligible = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. No session found.',
    });
  }

  const role = (req.user.role || '').toUpperCase();
  if (role === 'POSTER' || role === 'ADMIN') {
    return res.status(403).json({
      code: 'ROLE_INELIGIBLE',
      message: 'This account role is ineligible for Tasker KYC identity verification.',
    });
  }

  if (req.user.isVerified || req.user.verificationStatus === 'APPROVED') {
    return res.status(400).json({
      code: 'ALREADY_VERIFIED',
      message: 'Your identity has already been verified and approved.',
    });
  }

  if (req.user.verificationStatus === 'PENDING') {
    return res.status(400).json({
      code: 'VERIFICATION_PENDING',
      message: 'You already have an identity verification submission pending review.',
    });
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin,
  requireKYCEligible,
};
