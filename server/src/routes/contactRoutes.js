const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { validate, contactSchemas } = require('../middleware/validate');
const { sendContactInquiryEmail } = require('../services/emailService');

// Anti-spam contact limiter: max 5 submissions per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many contact inquiries from this IP. Please wait 15 minutes before sending another message.' },
  skip: () => process.env.NODE_ENV === 'test',
});

router.post('/', contactLimiter, validate(contactSchemas.submitInquiry), async (req, res, next) => {
  try {
    const { name, email, subject, category, message } = req.body;

    // Dispatch email notification to official customer support inbox
    await sendContactInquiryEmail({ name, email, subject, category, message });

    res.status(200).json({
      success: true,
      message: 'Thank you for contacting TaskConnect. Your inquiry has been routed to our support team (ranaumarbilal31@gmail.com), and we will reply within 2-4 hours.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
