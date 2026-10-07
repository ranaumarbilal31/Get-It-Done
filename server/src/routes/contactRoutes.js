const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { validate, contactSchemas } = require('../middleware/validate');
const prisma = require('../config/prisma');

// Anti-spam contact limiter: max 5 submissions per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      'Too many contact inquiries from this IP. Please wait 15 minutes before sending another message.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

router.post('/', contactLimiter, validate(contactSchemas.submitInquiry), async (req, res, next) => {
  try {
    const { name, email, subject, category, message } = req.body;

    await prisma.supportInquiry.create({ data: { name, email, subject, category, message } });
    res.json({
      success: true,
      message: 'Your inquiry has been received. Our team can review it in the support inbox.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
