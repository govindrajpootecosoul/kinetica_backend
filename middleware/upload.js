const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

// Removed Excel-only filter as requested
const fileFilter = (req, file, cb) => {
  cb(null, true);
};

module.exports = multer({ storage, fileFilter });
