const multer = require('multer');

const storage = multer.memoryStorage();

const ALLOWED_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    const err = new Error(
      `Unsupported image type: ${file.mimetype}. Allowed: JPEG, PNG, GIF, WEBP, HEIC.`
    );
    err.code = 'UNSUPPORTED_FILE_TYPE';
    cb(err);
  }
};

const multerInstance = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

function withErrorHandler(middleware) {
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (!err) return next();

      let message = err.message || 'File upload error';
      if (err.code === 'LIMIT_FILE_SIZE') {
        message = 'File too large. Maximum size is 10MB.';
      }
      return res.status(400).json({ error: 1, success: false, message });
    });
  };
}

module.exports = {
  single: (field) => withErrorHandler(multerInstance.single(field)),
  fields: (fieldsArr) => withErrorHandler(multerInstance.fields(fieldsArr)),
  array: (field, maxCount) => withErrorHandler(multerInstance.array(field, maxCount)),
};
