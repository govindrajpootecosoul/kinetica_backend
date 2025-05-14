const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadExcel, filterData } = require('../controllers/adDataController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

router.post('/upload', upload.single('file'), uploadExcel);
router.get('/filterData', filterData);

module.exports = router;
