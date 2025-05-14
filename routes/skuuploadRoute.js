const express = require('express');
const multer = require('multer');
const { uploadExcel } = require('../controllers/skuuploadController');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/skuupload', upload.single('file'), uploadExcel);

module.exports = router;
