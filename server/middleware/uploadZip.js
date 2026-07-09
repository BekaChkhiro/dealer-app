const multer = require('multer');

const storage = multer.memoryStorage();

// Allow zip archives (bulk vehicle photo upload)
const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream'
  ];
  cb(null, allowed.includes(file.mimetype));
};

const uploadZip = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for zip archives
});

module.exports = uploadZip;
