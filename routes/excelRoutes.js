// //pnl upload and get data

// const express = require('express');
// const multer = require('multer');
// const xlsx = require('xlsx');  // changed here
// const fs = require('fs');
// const path = require('path');
// const { Pnl } = require('../models/DataModel');

// const router = express.Router();
// const upload = multer({ dest: 'uploads/' });

// function excelDateToYYYYMM(serial) {
//   const excelEpoch = new Date(1899, 11, 30);
//   const date = new Date(excelEpoch.getTime() + Math.floor(serial) * 86400000);
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   return `${year}-${month}`;
// }

// async function handleExcelUpload(filePath, Model) {
//   const workbook = xlsx.readFile(filePath);
//   const sheetName = workbook.SheetNames[0];
//   const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

//   const formattedData = sheetData.map((row) => {
//     if (row['Year-Month'] && typeof row['Year-Month'] === 'number') {
//       row['Year-Month'] = excelDateToYYYYMM(row['Year-Month']);
//     }
//     return row;
//   });

//   const inserted = await Model.insertMany(formattedData);
//   fs.unlinkSync(filePath);
//   return inserted.length;
// }

// router.post('/upload-pnlll', upload.single('file'), async (req, res) => {
//   try {
//     const insertedCount = await handleExcelUpload(req.file.path, Pnl);
//     res.status(200).json({ message: 'PNL data uploaded successfully', records: insertedCount });
//   } catch (error) {
//     console.error('PNL upload error:', error);
//     res.status(500).json({ message: 'PNL upload failed', error: error.message });
//   }
// });

// //all data list
// // router.get('/pnl-data', async (req, res) => {
// //   try {
// //     const data = await Pnl.find();
// //     res.status(200).json(data);
// //   } catch (error) {
// //     console.error('Error fetching PNL data:', error);
// //     res.status(500).json({ message: 'Failed to retrieve PNL data', error });
// //   }
// // });



// //only  search with sku
// // router.get('/pnl-data', async (req, res) => {
// //   try {
// //     const { sku } = req.query;

// //     const filter = {};
// //     if (sku !== undefined) {
// //       filter.SKU = sku;
// //     }

// //     const data = await Pnl.find(filter);
// //     res.status(200).json(data);
// //   } catch (error) {
// //     console.error('Error fetching PNL data:', error);
// //     res.status(500).json({ message: 'Failed to retrieve PNL data', error });
// //   }
// // });


// //get data with sku and date
// router.get('/pnl-data', async (req, res) => {
//   try {
//     const { sku, date } = req.query;

//     const filter = {};

//     // Add SKU filter only if sku is provided and not null
//     if (sku != null && sku !== '') {
//       filter.SKU = Number(sku); // Convert to number (assuming SKU is stored as number)
//     }

//     // Add date filter only if date is provided and not null
//     if (date != null && date !== '') {
//       filter['Year-Month'] = date; // Example: '2025-04'
//     }

//     const data = await Pnl.find(filter);
//     res.status(200).json(data);
//   } catch (error) {
//     console.error('Error fetching PNL data:', error);
//     res.status(500).json({ message: 'Failed to retrieve PNL data', error });
//   }
// });


// router.get('/pnl-data-cm', async (req, res) => {
//   try {
//     const { sku, date } = req.query;
//     const filter = {};

//     // Filter by SKU if provided
//     if (sku != null && sku !== '') {
//       filter.SKU = Number(sku);
//     }

//     // Handle dynamic date filtering
//     let yearMonth = null;
//     const today = moment();

//     if (date === 'current') {
//       yearMonth = today.format('YYYY-MM');
//     } else if (date === 'last') {
//       yearMonth = today.subtract(1, 'months').format('YYYY-MM');
//     } else if (date && /^\d{4}-\d{2}$/.test(date)) {
//       yearMonth = date;
//     }

//     if (yearMonth) {
//       filter['Year-Month'] = yearMonth;
//     }

//     const data = await Pnl.find(filter);

//     if (!data.length) {
//       return res.status(200).json({ message: 'No data found', data: [], summary: {} });
//     }

//     // Sum up all numeric fields
//     const summary = {};

//     data.forEach(item => {
//       Object.keys(item._doc).forEach(key => {
//         const value = item[key];
//         if (typeof value === 'number') {
//           summary[key] = (summary[key] || 0) + value;
//         }
//       });
//     });

//     res.status(200).json({ data, summary });
//   } catch (error) {
//     console.error('Error fetching PNL data:', error);
//     res.status(500).json({ message: 'Failed to retrieve PNL data', error });
//   }
// });


// router.get('/ppnl-data', async (req, res) => {
//   try {
//     const { sku, date, startDate, endDate } = req.query;

//     const filter = {};

//     // SKU filter (if provided)
//     if (sku != null && sku !== '') {
//       filter.SKU = Number(sku);
//     }

//     // Exact date filter
//     if (date != null && date !== '') {
//       filter['Year-Month'] = date;
//     }

//     // Range filter (if both startDate and endDate are provided)
//     if (startDate && endDate) {
//       filter['Year-Month'] = { $gte: startDate, $lte: endDate };
//     }

//     const data = await Pnl.find(filter);
//     res.status(200).json(data);
//   } catch (error) {
//     console.error('Error fetching PNL data:', error);
//     res.status(500).json({ message: 'Failed to retrieve PNL data', error });
//   }
// });






// module.exports = router;





const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const moment = require('moment');  // <-- added moment import
const { Pnl } = require('../models/DataModel');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Convert Excel serial date to "YYYY-MM"
function excelDateToYYYYMM(serial) {
  const excelEpoch = new Date(1899, 11, 30);
  const date = new Date(excelEpoch.getTime() + Math.floor(serial) * 86400000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

async function handleExcelUpload(filePath, Model) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const formattedData = sheetData.map((row) => {
    if (row['Year-Month'] && typeof row['Year-Month'] === 'number') {
      row['Year-Month'] = excelDateToYYYYMM(row['Year-Month']);
    }
    return row;
  });

  const inserted = await Model.insertMany(formattedData);
  fs.unlinkSync(filePath);
  return inserted.length;
}

// Upload Excel file and insert data
router.post('/upload-pnlll', upload.single('file'), async (req, res) => {
  try {
    const insertedCount = await handleExcelUpload(req.file.path, Pnl);
    res.status(200).json({ message: 'PNL data uploaded successfully', records: insertedCount });
  } catch (error) {
    console.error('PNL upload error:', error);
    res.status(500).json({ message: 'PNL upload failed', error: error.message });
  }
});

// Get data with optional SKU and exact Year-Month
router.get('/pnl-data', async (req, res) => {
  try {
    const { sku, date } = req.query;
    const filter = {};

    if (sku != null && sku !== '') {
      filter.SKU = Number(sku);
    }
    if (date != null && date !== '') {
      filter['Year-Month'] = date;
    }

    const data = await Pnl.find(filter);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching PNL data:', error);
    res.status(500).json({ message: 'Failed to retrieve PNL data', error });
  }
});

// Get data and summary for current, last, or custom month
//const moment = require('moment'); // Ensure moment is imported

router.get('/pnl-data-cm', async (req, res) => {
  try {
    const { sku, date, startDate, endDate } = req.query;
    const filter = {};

    // SKU filter
    if (sku != null && sku !== '') {
      filter.SKU = Number(sku);
    }

    // Normalize month string (e.g. 2025-3 -> 2025-03)
    const normalizeMonth = (input) => {
      const [year, month] = input.split('-');
      return `${year}-${String(month).padStart(2, '0')}`;
    };

    let yearMonth = null;

    // If range is provided
    if (startDate && endDate) {
      const start = normalizeMonth(startDate);
      const end = normalizeMonth(endDate);
      filter['Year-Month'] = { $gte: start, $lte: end };
    } else if (date === 'current') {
      yearMonth = moment().format('YYYY-MM');
    } else if (date === 'last') {
      yearMonth = moment().subtract(1, 'months').format('YYYY-MM');
    } else if (date && /^\d{4}-\d{1,2}$/.test(date)) {
      yearMonth = normalizeMonth(date);
    }

    if (yearMonth) {
      filter['Year-Month'] = yearMonth;
    }

    const data = await Pnl.find(filter);

    if (!data.length) {
      return res.status(200).json({ message: 'No data found', summary: {} });
    }

    const summary = {};

    data.forEach(item => {
      Object.entries(item._doc).forEach(([key, value]) => {
        if (typeof value === 'number') {
          summary[key] = (summary[key] || 0) + value;
        }
      });
    });

    res.status(200).json({ summary });
  } catch (error) {
    console.error('Error fetching PNL summary:', error);
    res.status(500).json({ message: 'Failed to retrieve PNL summary', error });
  }
});



// Get data with SKU, exact date or date range (startDate-endDate)
router.get('/ppnl-data', async (req, res) => {
  try {
    const { sku, date, startDate, endDate } = req.query;
    const filter = {};

    if (sku != null && sku !== '') {
      filter.SKU = Number(sku);
    }

    // Exact date filter
    if (date != null && date !== '') {
      filter['Year-Month'] = date;
    }

    // Range filter if both startDate and endDate provided
    if (startDate && endDate) {
      filter['Year-Month'] = { $gte: startDate, $lte: endDate };
    }

    const data = await Pnl.find(filter);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching PNL data:', error);
    res.status(500).json({ message: 'Failed to retrieve PNL data', error });
  }
});

module.exports = router;
