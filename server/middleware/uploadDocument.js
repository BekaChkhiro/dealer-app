const multer = require('multer');

const storage = multer.memoryStorage();

// Allow images and PDF documents
const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ];
  cb(null, allowed.includes(file.mimetype));
};

const uploadDocument = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for documents
});

module.exports = uploadDocument;
