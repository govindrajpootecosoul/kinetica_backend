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


router.get('/pnl-data', async (req, res) => {
  try {
    const { sku, category, date, range, startMonth, endMonth, productName } = req.query;
    const filter = {};

    if (sku && sku.trim() !== '') {
      filter.SKU = sku;
    }

    if (category && category.trim() !== '') {
      filter['Product Category'] = category;
    }

    if (productName && productName.trim() !== '') {
      filter['Product Name'] = productName;
    }

    // Handle specific month
    if (date && date.trim() !== '') {
      filter['Year-Month'] = date;
    }

    // Handle predefined range types
    if (range) {
      const currentDate = moment();
      if (range === 'monthtodate') {
        filter['Year-Month'] = currentDate.format('YYYY-MM');
      } else if (range === 'lastmonth') {
        const lastMonth = currentDate.subtract(1, 'month').format('YYYY-MM');
        filter['Year-Month'] = lastMonth;
      } else if (range === 'yeartodate') {
        const months = [];
        const year = currentDate.year();
        const currentMonth = currentDate.month() + 1; // month() is 0-indexed
        for (let m = 1; m <= currentMonth; m++) {
          months.push(`${year}-${m.toString().padStart(2, '0')}`);
        }
        filter['Year-Month'] = { $in: months };
      }
    }

    // Handle custom range
    if (startMonth && endMonth) {
      const start = moment(startMonth, 'YYYY-MM');
      const end = moment(endMonth, 'YYYY-MM');
      const monthsInRange = [];

      while (start.isSameOrBefore(end)) {
        monthsInRange.push(start.format('YYYY-MM'));
        start.add(1, 'month');
      }

      filter['Year-Month'] = { $in: monthsInRange };
    }

    const data = await Pnl.find(filter);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching PNL data:', error);
    res.status(500).json({ message: 'Failed to retrieve PNL data', error });
  }
});


// router.get('/pnl-data', async (req, res) => {
//   try {
//     const { sku, date, category } = req.query;
//     const filter = {};

//     if (sku && sku.trim() !== '') {
//       filter.SKU = sku; // Do NOT convert to Number
//     }
//     if (date && date.trim() !== '') {
//       filter['Year-Month'] = date;
//     }
//     if (category && category.trim() !== '') {
//       filter['Product Category'] = category;
//     }

//     const data = await Pnl.find(filter);
//     res.status(200).json(data);
//   } catch (error) {
//     console.error('Error fetching PNL data:', error);
//     res.status(500).json({ message: 'Failed to retrieve PNL data', error });
//   }
// });



// for finance screen sku lavel


// router.get('/pnl-data', async (req, res) => {
//   try {
//     const { sku, category, date, range, startMonth, endMonth } = req.query;
//     const filter = {};

//     if (sku && sku.trim() !== '') {
//       filter.SKU = sku;
//     }

//     if (category && category.trim() !== '') {
//       filter['Product Category'] = category;
//     }

//     // Handle specific month
//     if (date && date.trim() !== '') {
//       filter['Year-Month'] = date;
//     }

//     // Handle predefined range types
//     if (range) {
//       const currentDate = moment();
//       if (range === 'monthtodate') {
//         filter['Year-Month'] = currentDate.format('YYYY-MM');
//       } else if (range === 'lastmonth') {
//         const lastMonth = currentDate.subtract(1, 'month').format('YYYY-MM');
//         filter['Year-Month'] = lastMonth;
//       } else if (range === 'yeartodate') {
//         const months = [];
//         const year = currentDate.year();
//         const currentMonth = currentDate.month() + 1; // month() is 0-indexed
//         for (let m = 1; m <= currentMonth; m++) {
//           months.push(`${year}-${m.toString().padStart(2, '0')}`);
//         }
//         filter['Year-Month'] = { $in: months };
//       }
//     }

//     // Handle custom range
//     if (startMonth && endMonth) {
//       const start = moment(startMonth, 'YYYY-MM');
//       const end = moment(endMonth, 'YYYY-MM');
//       const monthsInRange = [];

//       while (start.isSameOrBefore(end)) {
//         monthsInRange.push(start.format('YYYY-MM'));
//         start.add(1, 'month');
//       }

//       filter['Year-Month'] = { $in: monthsInRange };
//     }

//     const data = await Pnl.find(filter);
//     res.status(200).json(data);
//   } catch (error) {
//     console.error('Error fetching PNL data:', error);
//     res.status(500).json({ message: 'Failed to retrieve PNL data', error });
//   }
// });


router.get('/sku-list', async (req, res) => {
  try {
    const skus = await Pnl.distinct('SKU');
    res.status(200).json(skus);
  } catch (error) {
    console.error('Error fetching SKU list:', error);
    res.status(500).json({ message: 'Failed to retrieve SKU list', error });
  }
});

router.get('/category-list', async (req, res) => {
  try {
    const categories = await Pnl.distinct('Product Category');
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching Product Category list:', error);
    res.status(500).json({ message: 'Failed to retrieve Product Category list', error });
  }
});







// Get data and summary for current, last, or custom month
//const moment = require('moment'); // Ensure moment is imported

// router.get('/pnl-data-cm', async (req, res) => {
//   try {
//     const { sku, date, startDate, endDate } = req.query;
//     const filter = {};

//     // SKU filter
//     if (sku != null && sku !== '') {
//       filter.SKU = Number(sku);
//     }

//     // Normalize month string (e.g. 2025-3 -> 2025-03)
//     const normalizeMonth = (input) => {
//       const [year, month] = input.split('-');
//       return `${year}-${String(month).padStart(2, '0')}`;
//     };

//     let yearMonth = null;

//     // If range is provided
//     if (startDate && endDate) {
//       const start = normalizeMonth(startDate);
//       const end = normalizeMonth(endDate);
//       filter['Year-Month'] = { $gte: start, $lte: end };
//     } else if (date === 'current') {
//       yearMonth = moment().format('YYYY-MM');
//     } else if (date === 'last') {
//       yearMonth = moment().subtract(1, 'months').format('YYYY-MM');
//     } else if (date && /^\d{4}-\d{1,2}$/.test(date)) {
//       yearMonth = normalizeMonth(date);
//     }

//     if (yearMonth) {
//       filter['Year-Month'] = yearMonth;
//     }

//     const data = await Pnl.find(filter);

//     if (!data.length) {
//       return res.status(200).json({ message: 'No data found', summary: {} });
//     }

//     const summary = {};

//     data.forEach(item => {
//       Object.entries(item._doc).forEach(([key, value]) => {
//         if (typeof value === 'number') {
//           summary[key] = (summary[key] || 0) + value;
//         }
//       });
//     });

//     res.status(200).json({ summary });
//   } catch (error) {
//     console.error('Error fetching PNL summary:', error);
//     res.status(500).json({ message: 'Failed to retrieve PNL summary', error });
//   }
// });



router.get('/pnl-data-cm', async (req, res) => {
  try {
    const { sku, date, startDate, endDate } = req.query;
    const filter = {};

    // SKU filter
    if (sku != null && sku !== '') {
      filter.SKU = Number(sku);
    }

    const normalizeMonth = (input) => {
      const [year, month] = input.split('-');
      return `${year}-${String(month).padStart(2, '0')}`;
    };

    let yearMonth = null;

    // Range-based filter
    if (startDate && endDate) {
      const start = normalizeMonth(startDate);
      const end = normalizeMonth(endDate);
      filter['Year-Month'] = { $gte: start, $lte: end };
    } else if (date === 'current') {
      yearMonth = moment().format('YYYY-MM');
    } else if (date === 'last') {
      yearMonth = moment().subtract(1, 'months').format('YYYY-MM');
    } else if (date === 'previous-year') {
      const previousYear = moment().subtract(1, 'year').year();
      const start = `${previousYear}-01`;
      const end = `${previousYear}-12`;
      filter['Year-Month'] = { $gte: start, $lte: end };
    } else if (date === 'current-year') {
      const currentYear = moment().year();
      const currentMonth = moment().month() + 1; // month() is 0-based
      const start = `${currentYear}-01`;
      const end = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      filter['Year-Month'] = { $gte: start, $lte: end };
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

//working code 
// router.get('/pnl-data-cmm', async (req, res) => {
//   try {
//     const { sku, date, startDate, endDate } = req.query;
//     const filter = {};
//     const prevFilter = {};

//     const normalizeMonth = (input) => {
//       const [year, month] = input.split('-');
//       return `${year}-${String(month).padStart(2, '0')}`;
//     };

//     let yearMonth = null;
//     let prevYearMonth = null;

//     const now = moment().utc();

//     if (sku != null && sku !== '') {
//       filter.SKU = Number(sku);
//       prevFilter.SKU = Number(sku);
//     }

//     if (startDate && endDate) {
//       const start = normalizeMonth(startDate);
//       const end = normalizeMonth(endDate);
//       filter['Year-Month'] = { $gte: start, $lte: end };

//       const startMoment = moment(start).subtract(end.split('-')[1], 'months');
//       const endMoment = moment(start).subtract(1, 'months');
//       prevFilter['Year-Month'] = {
//         $gte: startMoment.format('YYYY-MM'),
//         $lte: endMoment.format('YYYY-MM')
//       };
//     } else if (date === 'monthtodate') {
//       yearMonth = now.format('YYYY-MM');
//       filter['Year-Month'] = yearMonth;
//       prevYearMonth = now.clone().subtract(1, 'months').format('YYYY-MM');
//       prevFilter['Year-Month'] = prevYearMonth;
//     } else if (date === 'lastmonth') {
//       yearMonth = now.clone().subtract(1, 'months').format('YYYY-MM');
//       filter['Year-Month'] = yearMonth;
//       prevYearMonth = now.clone().subtract(2, 'months').format('YYYY-MM');
//       prevFilter['Year-Month'] = prevYearMonth;
//     } else if (date === 'previous-year') {
//       const previousYear = now.clone().subtract(1, 'year').year();
//       const start = `${previousYear}-01`;
//       const end = `${previousYear}-12`;
//       filter['Year-Month'] = { $gte: start, $lte: end };

//       const startPrev = `${previousYear - 1}-01`;
//       const endPrev = `${previousYear - 1}-12`;
//       prevFilter['Year-Month'] = { $gte: startPrev, $lte: endPrev };
//     } else if (date === 'current-year') {
//       const currentYear = now.year();
//       const currentMonth = now.month() + 1;
//       const start = `${currentYear}-01`;
//       const end = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
//       filter['Year-Month'] = { $gte: start, $lte: end };

//       const startPrev = `${currentYear - 1}-01`;
//       const endPrev = `${currentYear - 1}-${String(currentMonth).padStart(2, '0')}`;
//       prevFilter['Year-Month'] = { $gte: startPrev, $lte: endPrev };
//     } else if (date && /^\d{4}-\d{1,2}$/.test(date)) {
//       yearMonth = normalizeMonth(date);
//       filter['Year-Month'] = yearMonth;
//       prevYearMonth = moment(yearMonth).subtract(1, 'months').format('YYYY-MM');
//       prevFilter['Year-Month'] = prevYearMonth;
//     }

//     const currentData = await Pnl.find(filter);
//     const previousData = await Pnl.find(prevFilter);

//     const summarize = (data) => {
//       const summary = {};
//       data.forEach(item => {
//         Object.entries(item._doc).forEach(([key, value]) => {
//           if (typeof value === 'number') {
//             summary[key] = (summary[key] || 0) + value;
//           }
//         });
//       });
//       return summary;
//     };

//     const currentSummary = summarize(currentData);
//     const previousSummary = summarize(previousData);

//     const percentChange = (current, previous) => {
//       if (previous === 0) return current === 0 ? 0 : 100;
//       return ((current - previous) / previous) * 100;
//     };

//     const cm1 = currentSummary['CM1'] || 0;
//     const cm2 = currentSummary['CM2'] || 0;
//     const cm3 = currentSummary['CM3'] || 0;

//     const prevCm1 = previousSummary['CM1'] || 0;
//     const prevCm2 = previousSummary['CM2'] || 0;
//     const prevCm3 = previousSummary['CM3'] || 0;

//     const cm1Change = percentChange(cm1, prevCm1);
//     const cm2Change = percentChange(cm2, prevCm2);
//     const cm3Change = percentChange(cm3, prevCm3);

//     return res.status(200).json({
//       summary: currentSummary,
//       previousSummary,
//       cmChange: {
//         CM1: cm1.toFixed(2),
//         CM1_ChangePercent: cm1Change.toFixed(2),
//         CM2: cm2.toFixed(2),
//         CM2_ChangePercent: cm2Change.toFixed(2),
//         CM3: cm3.toFixed(2),
//         CM3_ChangePercent: cm3Change.toFixed(2)
//       }
//     });
//   } catch (error) {
//     console.error('❌ Error fetching PNL summary:', error.message || error, error.stack);
//     return res.status(500).json({
//       message: 'Failed to retrieve PNL summary',
//       error: error.message || 'Unknown error'
//     });
//   }
// });


router.get('/pnl-data-cmm', async (req, res) => {
  try {
    const { sku, date, startDate, endDate } = req.query;
    const filter = {};
    const moment = require('moment');

    if (sku != null && sku !== '') {
      filter.SKU = Number(sku);
    }

    const normalizeMonth = (input) => {
      const [year, month] = input.split('-');
      return `${year}-${String(month).padStart(2, '0')}`;
    };

    const now = moment().utc();
    let yearMonth = null;

    if (startDate && endDate) {
      const start = normalizeMonth(startDate);
      const end = normalizeMonth(endDate);
      filter['Year-Month'] = { $gte: start, $lte: end };
    } else if (date === 'monthtodate') {
      yearMonth = now.format('YYYY-MM');
    } else if (date === 'lastmonth') {
      yearMonth = now.clone().subtract(1, 'months').format('YYYY-MM');
    } else if (date === 'previous-year') {
      const prevYear = now.clone().subtract(1, 'year').year();
      filter['Year-Month'] = { $gte: `${prevYear}-01`, $lte: `${prevYear}-12` };
    } else if (date === 'current-year') {
      const currentYear = now.year();
      const currentMonth = now.month() + 1;
      filter['Year-Month'] = {
        $gte: `${currentYear}-01`,
        $lte: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
      };
    } else if (date && /^\d{4}-\d{1,2}$/.test(date)) {
      yearMonth = normalizeMonth(date);
    }

    if (yearMonth) {
      filter['Year-Month'] = yearMonth;
    }

    const currentData = await Pnl.find(filter);
    if (!currentData.length) {
      return res.status(200).json({ message: 'No data found', summary: {}, cmPercentages: {} });
    }

    const summarize = (data) => {
      const result = {};
      data.forEach(item => {
        Object.entries(item._doc).forEach(([key, value]) => {
          if (typeof value === 'number') {
            result[key] = (result[key] || 0) + value;
          }
        });
      });
      return result;
    };

    const summary = summarize(currentData);

    const getPreviousPeriodFilter = () => {
      if (startDate && endDate) {
        const prevStart = moment(startDate, 'YYYY-MM').subtract(2, 'months');
        const prevEnd = moment(endDate, 'YYYY-MM').subtract(2, 'months');
        return {
          ...sku ? { SKU: Number(sku) } : {},
          'Year-Month': {
            $gte: prevStart.format('YYYY-MM'),
            $lte: prevEnd.format('YYYY-MM')
          }
        };
      }
      if (date === 'monthtodate') {
        const currentDay = now.date();
        const prevMonth = now.clone().subtract(1, 'month');
        const prevStart = prevMonth.clone().startOf('month');
        const prevEnd = prevMonth.clone().startOf('month').add(currentDay - 1, 'days');
        return {
          ...sku ? { SKU: Number(sku) } : {},
          'Year-Month': { $gte: prevStart.format('YYYY-MM'), $lte: prevEnd.format('YYYY-MM') }
        };
      }
      if (date === 'lastmonth') {
        const prev = now.clone().subtract(2, 'month').format('YYYY-MM');
        return { ...sku ? { SKU: Number(sku) } : {}, 'Year-Month': prev };
      }
      if (date === 'current-year') {
        const lastYear = now.clone().subtract(1, 'year').year();
        return {
          ...sku ? { SKU: Number(sku) } : {},
          'Year-Month': { $gte: `${lastYear}-01`, $lte: `${lastYear}-12` }
        };
      }
      if (date === 'previous-year') {
        const twoYearsAgo = now.clone().subtract(2, 'year').year();
        return {
          ...sku ? { SKU: Number(sku) } : {},
          'Year-Month': { $gte: `${twoYearsAgo}-01`, $lte: `${twoYearsAgo}-12` }
        };
      }
      return {};
    };

    const previousFilter = getPreviousPeriodFilter();
    const previousData = await Pnl.find(previousFilter);
    const previousSummary = summarize(previousData);

    const safeDivide = (num, den) => den !== 0 ? (num / den) * 100 : 0;
    const percentChange = (curr, prev) => {
      if (prev === 0) return curr === 0 ? 0 : 100;
      return ((curr - prev) / Math.abs(prev)) * 100;
    };

    const CM1 = summary['CM1'] || 0;
    const CM2 = summary['CM2'] || 0;
    const CM3 = summary['CM3'] || 0;
    const totalSalesTax = summary['Net Sales with tax'] || 0;

    const CM1_prev = previousSummary['CM1'] || 0;
    const CM2_prev = previousSummary['CM2'] || 0;
    const CM3_prev = previousSummary['CM3'] || 0;
    const totalSalesTax_prev = previousSummary['Net Sales with tax'] || 0;

    return res.status(200).json({
      summary,
      previousSummary,
      cmPercentages: {
        CM1: CM1.toFixed(2),
        CM1_Percent: safeDivide(CM1, totalSalesTax).toFixed(2),
        CM1_ChangePercent: percentChange(CM1, CM1_prev).toFixed(2),

        CM2: CM2.toFixed(2),
        CM2_Percent: safeDivide(CM2, totalSalesTax).toFixed(2),
        CM2_ChangePercent: percentChange(CM2, CM2_prev).toFixed(2),

        CM3: CM3.toFixed(2),
        CM3_Percent: safeDivide(CM3, totalSalesTax).toFixed(2),
        CM3_ChangePercent: percentChange(CM3, CM3_prev).toFixed(2)
      }
    });
  } catch (error) {
    console.error('❌ Error in /pnl-data-cmm:', error);
    return res.status(500).json({
      message: 'Failed to retrieve PNL summary',
      error: error.message || 'Unknown error'
    });
  }
});










module.exports = router;



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
