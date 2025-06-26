
const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const SubscribeSave = require('../models/subscribeSaveModel');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Convert '25-Apr' to '2025-04'
const parseMonthYear = (value) => {
  if (!value) return null;

  const [yearSuffix, monthAbbr] = value.split('-');
  const monthMap = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
  };

  const month = monthMap[monthAbbr];
  const year = `20${yearSuffix}`; // Convert '25' to '2025'

  return `${year}-${month}`; // e.g., '2025-04'
};

// Upload Excel Route
router.post('/subscribe-save/upload', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const formatted = data.map(row => ({
      MonthYear: parseMonthYear(row['Month-Year']),
      SKU: row['SKU'],
      Discount_with_tax: row['Discount_with_tax'],
      Quantity: row['Quantity'],
      Subscribers_Total_Discount: row['Subscribers_Total_Discount'],
      Subscribers_Total_Discount_with_tax: row['Subscribers_Total_Discount_with_tax'],
      Total_Subscribers_sales_with_tax: row['Total_Subscribers_sales_with_tax'],
      City: row['City'],
      State: row['State'],
      Country: row['Country'],
      Product_Category: row['Product_Category'],
      Product_Name: row['ProductName'],
      Subscriptions_Count: row['Subscriptions_Count']
    }));

    await SubscribeSave.insertMany(formatted);

    res.status(200).json({ success: true, message: 'Data uploaded successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Route with Filters
// router.get('/subscribe-save', async (req, res) => {
//   try {
//     const { filter, startDate, endDate } = req.query;

//     let fromMonth, toMonth;
//     const now = new Date();

//     const pad = n => n.toString().padStart(2, '0');
//     const ym = (y, m) => `${y}-${pad(m)}`;

//     switch (filter) {
//       case 'lastmonth':
//         const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//         fromMonth = ym(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1);
//         toMonth = fromMonth;
//         break;

//       case 'monthtodate':
//         fromMonth = ym(now.getFullYear(), now.getMonth() + 1);
//         toMonth = fromMonth;
//         break;

//       case 'yeartodate':
//         fromMonth = ym(now.getFullYear(), 1);
//         toMonth = ym(now.getFullYear(), now.getMonth() + 1);
//         break;

//       case 'custom':
//         if (!startDate || !endDate) {
//           return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
//         }
//         fromMonth = startDate; // Format: "YYYY-MM"
//         toMonth = endDate;
//         break;

//       default:
//         return res.status(400).json({ success: false, message: 'Invalid filter' });
//     }

//     const results = await SubscribeSave.find({
//       MonthYear: { $gte: fromMonth, $lte: toMonth }
//     });

//     res.json({ success: true, data: results });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

router.get('/subscribe-save', async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;

    let fromMonth, toMonth;
    const now = new Date();

    const pad = n => n.toString().padStart(2, '0');
    const ym = (y, m) => `${y}-${pad(m)}`;

    switch (filter) {
      case 'lastmonth':
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        fromMonth = ym(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1);
        toMonth = fromMonth;
        break;

      case 'monthtodate':
        fromMonth = ym(now.getFullYear(), now.getMonth() + 1);
        toMonth = fromMonth;
        break;

      case 'yeartodate':
        fromMonth = ym(now.getFullYear(), 1);
        toMonth = ym(now.getFullYear(), now.getMonth() + 1);
        break;

      case 'custom':
        if (!startDate || !endDate) {
          return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
        }
        fromMonth = startDate; // Format: "YYYY-MM"
        toMonth = endDate;
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid filter' });
    }

    const results = await SubscribeSave.aggregate([
      {
        $match: {
          MonthYear: { $gte: fromMonth, $lte: toMonth }
        }
      },
      {
        $group: {
          _id: '$Product_Category',
          totalSales: { $sum: '$Total_Subscribers_sales_with_tax' }
        }
      },
      {
        $project: {
          _id: 0,
          Product_Category: '$_id',
          Total_Subscribers_Sales_With_Tax: { $round: ['$totalSales', 2] }
        }
      }
    ]);

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


module.exports = router;
