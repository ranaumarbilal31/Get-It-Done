const errorHandler = (err, req, res, next) => {
  if (!err.status || err.status >= 500)
    console.error('[Request failed]', err.code || err.name || 'Error');

  if (err.status && err.status >= 400 && err.status < 600)
    return res.status(err.status).json({ message: err.message });
  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target ? err.meta.target : 'field';
    return res.status(400).json({
      code: 'RECORD_EXISTS',
      message: `A record with this ${field} already exists.`,
    });
  }

  // Multer errors or custom file upload errors
  if (
    err.name === 'MulterError' ||
    err.code === 'INVALID_FILE_TYPE' ||
    err.code === 'FILE_TOO_LARGE' ||
    err.status === 400 ||
    (err.message && err.message.includes('Only image files'))
  ) {
    return res.status(400).json({
      code: err.code || 'INVALID_FILE_TYPE',
      message: err.message || 'File upload error occurred.',
    });
  }

  const statusCode = res.statusCode >= 400 && res.statusCode < 600 ? res.statusCode : 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const safeMessage =
    isProduction && statusCode === 500
      ? 'An unexpected system error occurred. Please try again or contact support.'
      : err.message || 'An internal server error occurred.';

  res.status(statusCode).json({
    message: safeMessage,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;
