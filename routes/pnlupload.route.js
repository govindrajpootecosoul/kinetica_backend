// // routes/upload.route.js
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const router = express.Router();

// const Pnl = require('../models/pnl.model');
// const handlePnlExcelUpload = require('../utils/handlePnlExcelUpload');

// const upload = multer({ dest: 'uploads/' });

// router.post('/upload-pnll', upload.single('excelFile'), async (req, res) => {
//   const filePath = req.file.path;

//   try {
//     const insertedCount = await handlePnlExcelUpload(filePath, Pnl);
//     fs.unlinkSync(filePath); // Clean up uploaded file
//     res.status(200).json({ message: `${insertedCount} PNL records inserted successfully.` });
//   } catch (error) {
//     console.error('Upload error:', error);
//     res.status(500).json({ error: 'Failed to upload PNL Excel file.' });
//   }
// });

// module.exports = router;
