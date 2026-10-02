const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif|pdf/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const extValid = allowedTypes.test(ext);
  const mimetypeValid = allowedTypes.test(file.mimetype);

  if (extValid && mimetypeValid) {
    return cb(null, true);
  }
  const error = new Error('Only image files (jpg, png, webp) and PDF documents are allowed!');
  error.code = 'INVALID_FILE_TYPE';
  error.status = 400;
  cb(error);
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

/**
 * Safe upload middleware wrapper that handles Multer errors cleanly
 * and prevents unhandled 500 errors.
 */
const handleUploadSingle = (fieldName) => {
  const single = upload.single(fieldName);
  return (req, res, next) => {
    single(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds maximum allowed limit of 10MB.',
          });
        }
        if (err.name === 'MulterError') {
          return res.status(400).json({
            code: 'UPLOAD_ERROR',
            message: `File upload error: ${err.message}`,
          });
        }
        return res.status(400).json({
          code: err.code || 'INVALID_FILE_TYPE',
          message: err.message || 'Only image files (jpg, png, webp) and PDF documents are allowed!',
        });
      }
      next();
    });
  };
};

upload.handleUploadSingle = handleUploadSingle;

module.exports = upload;
