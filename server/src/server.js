require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const prisma = require('./config/prisma');
const errorHandler = require('./middleware/errorHandler');
const setupSockets = require('./sockets/chatSocket');

// Route imports
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const taskRoutes = require('./routes/taskRoutes');
const offerRoutes = require('./routes/offerRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();
const server = http.createServer(app);

// Enterprise HTTP Security Headers & Permissions Policy
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=(), payment=(self)');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// 1. HTTP Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://images.unsplash.com',
          'https://api.dicebear.com',
          'https://*.tile.openstreetmap.org',
          'https://*.openstreetmap.org',
          'https://res.cloudinary.com',
          'https://unpkg.com',
        ],
        connectSrc: [
          "'self'",
          'ws:',
          'wss:',
          'http://localhost:*',
          'https://*.vercel.app',
          'https://*.onrender.com',
        ],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Rate Limiting Defense
// General API rate limiter: 120 requests per minute
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after a minute.' },
  skip: () => process.env.NODE_ENV === 'test',
});

// Stricter Auth rate limiter: 15 login/register attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again in 15 minutes.' },
  skip: () => process.env.NODE_ENV === 'test',
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// 3. Cross-Origin Resource Sharing (CORS) - Strict Allowlist
const baseAllowedOrigins = [
  'https://get-it-done-steel.vercel.app',
  'https://get-it-done-phalanx1.vercel.app',
  'https://get-it-done-git-main-phalanx1.vercel.app',
  'https://get-it-done.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

const envOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.ALLOWED_ORIGINS,
  process.env.PUBLIC_SITE_URL,
];

envOrigins.forEach((envVal) => {
  if (envVal && envVal !== '*') {
    envVal.split(',').forEach((url) => {
      const trimmed = url.trim();
      if (trimmed && !baseAllowedOrigins.includes(trimmed)) {
        baseAllowedOrigins.push(trimmed);
      }
    });
  }
});

const isOriginAllowed = (origin) => {
  if (!origin) return true; // server-to-server, mobile, curl, Supertest
  if (baseAllowedOrigins.includes(origin)) return true;
  // Allow all project Vercel deployments (production, branch, preview)
  if (/^https:\/\/get-it-done[a-z0-9-]*\.vercel\.app$/.test(origin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Return boolean cleanly to prevent 500 unhandled errors on disallowed origins
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input Security Guard: Block NUL bytes and Prototype Pollution
app.use((req, res, next) => {
  const fullUrl = req.originalUrl || req.url || '';

  // Check for NUL bytes in the raw URL
  if (fullUrl.includes('%00') || fullUrl.includes('\0') || fullUrl.includes('\u0000')) {
    return res.status(400).json({
      code: 'INVALID_INPUT',
      message: 'Input contains invalid characters (null byte).',
    });
  }

  // Check for Prototype Pollution attempts in URL string (keys or values)
  if (fullUrl.includes('__proto__') || fullUrl.includes('constructor') || fullUrl.includes('prototype')) {
    return res.status(400).json({
      code: 'SUSPICIOUS_INPUT',
      message: 'Suspicious input parameter detected.',
    });
  }

  // Recursive checker for objects
  const hasSecurityViolation = (obj) => {
    if (!obj || typeof obj !== 'object') return null;

    for (const key of Object.keys(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return {
          code: 'SUSPICIOUS_INPUT',
          message: 'Suspicious input parameter detected.',
        };
      }

      const val = obj[key];
      if (typeof val === 'string') {
        if (val.includes('\0') || val.includes('\u0000') || val.includes('%00')) {
          return {
            code: 'INVALID_INPUT',
            message: 'Input contains invalid characters (null byte).',
          };
        }
        if (val === '__proto__' || val.includes('__proto__')) {
          return {
            code: 'SUSPICIOUS_INPUT',
            message: 'Suspicious input parameter detected.',
          };
        }
      } else if (typeof val === 'object') {
        const violation = hasSecurityViolation(val);
        if (violation) return violation;
      }
    }
    return null;
  };

  const queryViolation = hasSecurityViolation(req.query);
  if (queryViolation) return res.status(400).json(queryViolation);

  const bodyViolation = hasSecurityViolation(req.body);
  if (bodyViolation) return res.status(400).json(bodyViolation);

  const paramsViolation = hasSecurityViolation(req.params);
  if (paramsViolation) return res.status(400).json(paramsViolation);

  next();
});

// Static local uploads (development fallback)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Minimal Public Liveness Probe (Scrubbed of DB internals and versions)
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'degraded' });
  }
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

// Unmatched API Route JSON 404 Handler
app.all('/api/*', (req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    error: 'Not Found',
    message: `API endpoint ${req.method} ${req.originalUrl} does not exist.`,
  });
});

// Global Error Handler
app.use(errorHandler);

// Setup WebSockets
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setupSockets(io);
app.set('io', io);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 TaskConnect Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`📁 Local uploads directory: ${path.join(__dirname, '../uploads')}`);
  });
}

module.exports = { app, server };
