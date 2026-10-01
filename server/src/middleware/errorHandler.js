const errorHandler = (err, req, res, next) => {
  console.error('[Error Details]:', err);

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target ? err.meta.target : 'field';
    return res.status(400).json({
      message: `A record with this ${field} already exists.`,
    });
  }

  // Multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      message: `File upload error: ${err.message}`,
    });
  }

  const statusCode = res.statusCode >= 400 && res.statusCode < 600 ? res.statusCode : 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const safeMessage = (isProduction && statusCode === 500)
    ? 'An unexpected system error occurred. Please try again or contact support.'
    : (err.message || 'An internal server error occurred.');

  res.status(statusCode).json({
    message: safeMessage,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;
