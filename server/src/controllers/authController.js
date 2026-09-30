const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { sendWelcomeEmail } = require('../services/emailService');
const { uploadToStorage } = require('../services/storageService');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'taskconnect_dev_secret_key_change_in_production_998877',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
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

    const token = generateToken(user.id);

    // Send welcome email (fire-and-forget)
    sendWelcomeEmail(user).catch(console.error);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password credentials.' });
    }

    const token = generateToken(user.id);

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
    } else if (req.body.idDocument) {
      documentUrl = req.body.idDocument;
    }

    if (!documentUrl) {
      return res.status(400).json({ message: 'Please upload an ID document photo or provide a document URL.' });
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
      message: 'Identity verification submitted for review. An administrator will review your documents.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  submitVerification,
};
