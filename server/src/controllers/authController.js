const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const security = require('./accountSecurityController');
const { uploadToStorage } = require('../services/storageService');

const generateToken = (userId, sessionVersion = 0) => {
  return jwt.sign(
    { userId, sessionVersion },
    process.env.JWT_SECRET || 'getitdone_dev_secret_key_change_in_production_998877',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (
      !(process.env.NODE_ENV === 'test' && process.env.EMAIL_TRANSPORT === 'capture') &&
      (!process.env.EMAIL_RELAY_URL || !process.env.EMAIL_RELAY_SECRET)
    )
      return res
        .status(503)
        .json({ message: 'Account email delivery is unavailable. Please try again later.' });
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res
        .status(201)
        .json({
          message: 'Check your email for activation instructions if this address is eligible.',
          requiresVerification: true,
        });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        isEmailVerified: false,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        isVerified: true,
        verificationStatus: true,
        walletBalance: true,
        ratingAvg: true,
        ratingCount: true,
        createdAt: true,
      },
    });

    await security.issue(user, 'activation');
    res
      .status(201)
      .json({
        message: 'Check your email for activation instructions if this address is eligible.',
        requiresVerification: true,
      });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      if (email.toLowerCase() === 'admin@getitdone.com') {
        user = await prisma.user.findUnique({ where: { email: 'admin@taskconnect.com' } });
      } else if (email.toLowerCase() === 'admin@taskconnect.com') {
        user = await prisma.user.findUnique({ where: { email: 'admin@getitdone.com' } });
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password credentials.' });
    }

    if (!user.isEmailVerified)
      return res
        .status(403)
        .json({
          code: 'EMAIL_UNVERIFIED',
          message: 'Activate your account from your email before logging in.',
        });
    const token = generateToken(user.id, user.sessionVersion);

    // Set secure HttpOnly cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
    res.cookie('getitdone_token', token, cookieOptions);
    res.cookie('taskconnect_token', token, cookieOptions);

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      phone: user.phone,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus,
      idDocument: user.idDocument,
      walletBalance: user.walletBalance,
      ratingAvg: user.ratingAvg,
      ratingCount: user.ratingCount,
      createdAt: user.createdAt,
    };

    res.json({
      message: 'Login successful',
      token,
      user: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
        idDocument: true,
        verificationNotes: true,
        walletBalance: true,
        ratingAvg: true,
        ratingCount: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, phone, avatar } = req.body;

    let avatarUrl = avatar;
    if (req.file) {
      avatarUrl = await uploadToStorage(req.file);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(phone !== undefined && { phone }),
        ...(avatarUrl && { avatar: avatarUrl }),
      },
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
        idDocument: true,
        walletBalance: true,
        ratingAvg: true,
        ratingCount: true,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

const submitVerification = async (req, res, next) => {
  try {
    let documentUrl = null;
    if (req.file) {
      documentUrl = await uploadToStorage(req.file);
    }

    if (!documentUrl) {
      return res.status(400).json({ message: 'Please upload an identity document.' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        idDocument: documentUrl,
        verificationStatus: 'PENDING',
        verificationNotes: req.body.notes || 'Identity document submitted for verification',
      },
      select: {
        id: true,
        name: true,
        isVerified: true,
        verificationStatus: true,
        idDocument: true,
      },
    });

    res.json({
      message:
        'Identity verification submitted for review. An administrator will review your documents.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };
  res.clearCookie('getitdone_token', cookieOptions);
  res.clearCookie('taskconnect_token', cookieOptions);
  res.json({ message: 'Logged out successfully' });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  submitVerification,
};
