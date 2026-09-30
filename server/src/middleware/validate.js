const { z } = require('zod');

/**
 * Higher-order middleware to validate incoming request data against a Zod schema.
 * @param {z.ZodSchema} schema - The Zod schema to validate against.
 * @param {'body' | 'query' | 'params'} source - The request property to validate. Defaults to 'body'.
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const parsed = schema.parse(req[source]);
    req[source] = parsed; // Attach cleaned/typed data
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({
        message: formattedErrors[0]?.message || 'Invalid input data provided.',
        errors: formattedErrors,
      });
    }
    next(error);
  }
};

// Validation Schemas

const authSchemas = {
  register: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name cannot exceed 60 characters'),
    email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password cannot exceed 100 characters'),
  }),
  login: z.object({
    email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
  updateProfile: z.object({
    name: z.string().trim().min(2).max(60).optional(),
    bio: z.string().trim().max(1000).optional(),
    phone: z.string().trim().max(30).optional(),
    avatar: z.string().optional(),
  }),
  verifyId: z.object({
    notes: z.string().trim().max(500).optional(),
    idDocument: z.string().optional(),
  }),
};

const taskSchemas = {
  createTask: z.object({
    title: z.string().trim().min(5, 'Title must be at least 5 characters').max(120, 'Title cannot exceed 120 characters'),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(3000, 'Description cannot exceed 3000 characters'),
    budget: z.preprocess((val) => Number(val), z.number().min(5, 'Budget must be at least $5').max(50000, 'Budget cannot exceed $50,000')),
    categoryId: z.string().min(1, 'Category is required'),
    isRemote: z.preprocess((val) => val === true || val === 'true', z.boolean()).optional().default(false),
    location: z.string().trim().max(200).optional(),
    latitude: z.preprocess((val) => (val !== undefined && val !== '' ? Number(val) : null), z.number().nullable().optional()),
    longitude: z.preprocess((val) => (val !== undefined && val !== '' ? Number(val) : null), z.number().nullable().optional()),
    dueDate: z.string().optional().nullable(),
    images: z.any().optional(),
  }),
  updateTask: z.object({
    title: z.string().trim().min(5).max(120).optional(),
    description: z.string().trim().min(10).max(3000).optional(),
    budget: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().min(5).max(50000).optional()),
    categoryId: z.string().optional(),
    isRemote: z.preprocess((val) => val === true || val === 'true', z.boolean()).optional(),
    location: z.string().trim().max(200).optional(),
    dueDate: z.string().optional().nullable(),
  }),
};

const offerSchemas = {
  createOffer: z.object({
    amount: z.preprocess((val) => Number(val), z.number().min(5, 'Offer amount must be at least $5').max(50000, 'Offer amount cannot exceed $50,000')),
    message: z.string().trim().min(5, 'Proposal message must be at least 5 characters').max(1500, 'Proposal message cannot exceed 1500 characters'),
  }),
};

const reviewSchemas = {
  createReview: z.object({
    rating: z.preprocess((val) => Number(val), z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5')),
    comment: z.string().trim().min(3, 'Review comment must be at least 3 characters').max(1000, 'Review comment cannot exceed 1000 characters'),
  }),
};

const adminSchemas = {
  updateVerification: z.object({
    status: z.enum(['APPROVED', 'REJECTED'], { errorMap: () => ({ message: 'Status must be APPROVED or REJECTED' }) }),
    notes: z.string().trim().max(500).optional(),
  }),
  toggleRole: z.object({
    role: z.enum(['USER', 'ADMIN'], { errorMap: () => ({ message: 'Role must be USER or ADMIN' }) }),
  }),
};

module.exports = {
  validate,
  authSchemas,
  taskSchemas,
  offerSchemas,
  reviewSchemas,
  adminSchemas,
};
