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

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || 'An internal server error occurred',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
