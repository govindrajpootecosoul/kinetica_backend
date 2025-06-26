const express = require("express");
const router = express.Router();
const multer = require("multer");
const xlsx = require("xlsx");
const CombinedCatalogue = require("../models/combinedCatalogueModel");

// Set up multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * POST /api/data/combined_catalogue
 * Upload Excel file and save to MongoDB
 */
function formatExcelDate(value) {
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000); // Excel serial to JS date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  } else if (typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)) {
    return value; // Already in correct format
  } else {
    return "Invalid-Date";
  }
}

// 📥 POST: Upload Excel file and save to MongoDB
router.post('/combined_catalogue', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const formattedData = data.map(row => ({
      ASIN: row['ASIN'],
      Impressions: Number(row['Impressions']) || 0,
      Clicks: Number(row['Clicks']) || 0,
      AddToCart: Number(row['Add to cart']) || 0,
      YearMonth: formatExcelDate(row['Year-Month']),
      ProductCategory: row['Product Category'],
      SKU: row['SKU'],
      ProductName: row['Product Name'],
      CTR: parseFloat(row['CTR']) || 0
    })).filter(item => item.YearMonth !== "Invalid-Date"); // optional filter

    await CombinedCatalogue.insertMany(formattedData);

    res.status(200).json({
      success: true,
      message: "Excel data uploaded successfully.",
      insertedCount: formattedData.length
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ success: false, message: "Upload failed", error });
  }
});

/**
 * GET /api/data/combined_catalogue
 * Filter data by date ranges
 */


router.get('/combined_catalogue/monthly-summary', async (req, res) => {
  try {
    const monthShortName = m => new Date(2000, m - 1).toLocaleString('default', { month: 'short' }).toLowerCase();

    const data = await CombinedCatalogue.aggregate([
      {
        $group: {
          _id: "$YearMonth",
          TotalImpressions: { $sum: "$Impressions" },
          TotalClicks: { $sum: "$Clicks" },
          TotalAddToCart: { $sum: "$AddToCart" }
        }
      },
      {
        $project: {
          YearMonth: "$_id",
          TotalImpressions: 1,
          TotalClicks: 1,
          TotalAddToCart: 1,
          _id: 0
        }
      },
      {
        $sort: { YearMonth: 1 }
      }
    ]);

    const result = { success: true };

    data.forEach(item => {
      const [year, month] = item.YearMonth.split("-");
      const key = monthShortName(parseInt(month)); // e.g., "jan", "feb"
      result[key] = [item]; // Keep it as array as per your format
    });

    res.json(result);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Error fetching monthly summary", error: err.message });
  }
});




// router.get('/combined_catalogue', async (req, res) => {
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
//         fromMonth = startDate;
//         toMonth = endDate;
//         break;

//       default:
//         return res.status(400).json({ success: false, message: 'Invalid filter' });
//     }

//     const results = await CombinedCatalogue.find({
//       YearMonth: { $gte: fromMonth, $lte: toMonth }
//     });

//     res.json({ success: true, data: results });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });


/**
 * GET /api/data/combined_catalogue/impressions-summary
 * Group by ProductCategory and sum Impressions
 */
// router.get('/combined_catalogue/impressions-summary', async (req, res) => {
//   try {
//     const results = await CombinedCatalogue.aggregate([
//       {
//         $group: {
//           _id: "$ProductCategory",
//           TotalImpressions: { $sum: "$Impressions" }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           ProductCategory: "$_id",
//           TotalImpressions: 1
//         }
//       },
//       {
//         $sort: { TotalImpressions: -1 } // Optional: sort by impressions descending
//       }
//     ]);

//     res.status(200).json({ success: true, data: results });
//   } catch (err) {
//     console.error("Aggregation Error:", err);
//     res.status(500).json({ success: false, message: "Failed to fetch summary", error: err.message });
//   }
// });


/**
 * GET /api/data/combined_catalogue/impressions-summary
 * Dynamically return last 2 months impression summary grouped by ProductCategory + total impressions
 */

// router.get('/combined_catalogue/impressions-summary', async (req, res) => {
//   try {
//     const pad = n => n.toString().padStart(2, '0');
//     const ym = (y, m) => `${y}-${pad(m)}`;
//     const monthName = m => new Date(2000, m - 1).toLocaleString('default', { month: 'long' });

//     const now = new Date();
//     const month1 = new Date(now.getFullYear(), now.getMonth() - 1);
//     const month2 = new Date(now.getFullYear(), now.getMonth() - 2);

//     const month1Str = ym(month1.getFullYear(), month1.getMonth() + 1);
//     const month2Str = ym(month2.getFullYear(), month2.getMonth() + 1);
//     const month1Label = monthName(month1.getMonth() + 1);
//     const month2Label = monthName(month2.getMonth() + 1);

//     const getSummary = async (monthStr) => {
//       return CombinedCatalogue.aggregate([
//         { $match: { YearMonth: monthStr } },
//         {
//           $group: {
//             _id: "$ProductCategory",
//             TotalImpressions: { $sum: "$Impressions" }
//           }
//         },
//         {
//           $project: {
//             ProductCategory: "$_id",
//             TotalImpressions: 1,
//             _id: 0
//           }
//         },
//         { $sort: { TotalImpressions: -1 } }
//       ]);
//     };

//     const month2Data = await getSummary(month2Str);
//     const month1Data = await getSummary(month1Str);

//     const total = data => data.reduce((sum, item) => sum + item.TotalImpressions, 0);

//     res.status(200).json({
//       success: true,
//       [`TotalImpressions${month2Label}`]: total(month2Data),
//       [`TotalImpressions${month1Label}`]: total(month1Data),
//       [month2Label.toLowerCase()]: month2Data,
//       [month1Label.toLowerCase()]: month1Data
//     });
//   } catch (err) {
//     console.error("Error:", err);
//     res.status(500).json({ success: false, message: "Error fetching impressions summary", error: err.message });
//   }
// });


router.get('/combined_catalogue/impressions-summary', async (req, res) => {
  try {
    const pad = n => n.toString().padStart(2, '0');
    const ym = (y, m) => `${y}-${pad(m)}`;
    const monthName = m => new Date(2000, m - 1).toLocaleString('default', { month: 'long' });

    const now = new Date();
    const month1 = new Date(now.getFullYear(), now.getMonth() - 1); // Last month
    const month2 = new Date(now.getFullYear(), now.getMonth() - 2); // Two months ago

    const month1Str = ym(month1.getFullYear(), month1.getMonth() + 1);
    const month2Str = ym(month2.getFullYear(), month2.getMonth() + 1);
    const month1Label = monthName(month1.getMonth() + 1);
    const month2Label = monthName(month2.getMonth() + 1);

    const getTotalImpressions = async (monthStr) => {
      const result = await CombinedCatalogue.aggregate([
        { $match: { YearMonth: monthStr } },
        {
          $group: {
            _id: null,
            TotalImpressions: { $sum: "$Impressions" }
          }
        },
        {
          $project: {
            _id: 0,
            TotalImpressions: 1
          }
        }
      ]);
      return result[0]?.TotalImpressions || 0;
    };

    const month2Impressions = await getTotalImpressions(month2Str);
    const month1Impressions = await getTotalImpressions(month1Str);

    res.status(200).json({
      success: true,
      [`TotalImpressions${month2Label}`]: month2Impressions,
      [`TotalImpressions${month1Label}`]: month1Impressions
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Error fetching impressions summary", error: err.message });
  }
});



router.get('/combined_catalogue/clicks-summary', async (req, res) => {
  try {
    const pad = n => n.toString().padStart(2, '0');
    const ym = (y, m) => `${y}-${pad(m)}`;
    const monthName = m => new Date(2000, m - 1).toLocaleString('default', { month: 'long' });

    const now = new Date();
    const month1 = new Date(now.getFullYear(), now.getMonth() - 1);
    const month2 = new Date(now.getFullYear(), now.getMonth() - 2);

    const month1Str = ym(month1.getFullYear(), month1.getMonth() + 1);
    const month2Str = ym(month2.getFullYear(), month2.getMonth() + 1);
    const month1Label = monthName(month1.getMonth() + 1);
    const month2Label = monthName(month2.getMonth() + 1);

    const getSummary = async (monthStr) => {
      return CombinedCatalogue.aggregate([
        { $match: { YearMonth: monthStr } },
        {
          $group: {
            _id: "$ProductCategory",
            TotalClicks: { $sum: "$Clicks" }
          }
        },
        {
          $project: {
            ProductCategory: "$_id",
            TotalClicks: 1,
            _id: 0
          }
        },
        { $sort: { TotalClicks: -1 } }
      ]);
    };

    const month2Data = await getSummary(month2Str);
    const month1Data = await getSummary(month1Str);

    const total = data => data.reduce((sum, item) => sum + item.TotalClicks, 0);

    res.status(200).json({
      success: true,
      [`TotalClicks${month2Label}`]: total(month2Data),
      [`TotalClicks${month1Label}`]: total(month1Data),
      [month2Label.toLowerCase()]: month2Data,
      [month1Label.toLowerCase()]: month1Data
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Error fetching clicks summary", error: err.message });
  }
});



router.get('/combined_catalogue/add-to-cart-summary', async (req, res) => {
  try {
    const pad = n => n.toString().padStart(2, '0');
    const ym = (y, m) => `${y}-${pad(m)}`;
    const monthName = m => new Date(2000, m - 1).toLocaleString('default', { month: 'long' });

    const now = new Date();
    const month1 = new Date(now.getFullYear(), now.getMonth() - 1);
    const month2 = new Date(now.getFullYear(), now.getMonth() - 2);

    const month1Str = ym(month1.getFullYear(), month1.getMonth() + 1);
    const month2Str = ym(month2.getFullYear(), month2.getMonth() + 1);
    const month1Label = monthName(month1.getMonth() + 1);
    const month2Label = monthName(month2.getMonth() + 1);

    const getSummary = async (monthStr) => {
      return CombinedCatalogue.aggregate([
        { $match: { YearMonth: monthStr } },
        {
          $group: {
            _id: "$ProductCategory",
            TotalAddToCart: { $sum: "$AddToCart" }
          }
        },
        {
          $project: {
            ProductCategory: "$_id",
            TotalAddToCart: 1,
            _id: 0
          }
        },
        { $sort: { TotalAddToCart: -1 } }
      ]);
    };

    const month2Data = await getSummary(month2Str);
    const month1Data = await getSummary(month1Str);

    const total = data => data.reduce((sum, item) => sum + item.TotalAddToCart, 0);

    res.status(200).json({
      success: true,
      [`TotalAddToCart${month2Label}`]: total(month2Data),
      [`TotalAddToCart${month1Label}`]: total(month1Data),
      [month2Label.toLowerCase()]: month2Data,
      [month1Label.toLowerCase()]: month1Data
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Error fetching AddToCart summary", error: err.message });
  }
});



// router.get('/combined_catalogue/summary', async (req, res) => {
//   try {
//     const pad = n => n.toString().padStart(2, '0');
//     const ym = (y, m) => `${y}-${pad(m)}`;
//     const monthName = m => new Date(2000, m - 1).toLocaleString('default', { month: 'long' });

//     const now = new Date();
//     const month1 = new Date(now.getFullYear(), now.getMonth() - 1); // Last month
//     const month2 = new Date(now.getFullYear(), now.getMonth() - 2); // Two months ago

//     const month1Str = ym(month1.getFullYear(), month1.getMonth() + 1);
//     const month2Str = ym(month2.getFullYear(), month2.getMonth() + 1);

//     const month1Label = monthName(month1.getMonth() + 1); // e.g., "May"
//     const month2Label = monthName(month2.getMonth() + 1); // e.g., "April"

//     const getSummaryByMonth = async (monthStr) => {
//       return CombinedCatalogue.aggregate([
//         { $match: { YearMonth: monthStr } },
//         {
//           $group: {
//             _id: "$ProductCategory",
//             TotalImpressions: { $sum: "$Impressions" },
//             TotalClicks: { $sum: "$Clicks" },
//             TotalAddToCart: { $sum: "$AddToCart" }
//           }
//         },
//         {
//           $project: {
//             ProductCategory: "$_id",
//             TotalImpressions: 1,
//             TotalClicks: 1,
//             TotalAddToCart: 1,
//             _id: 0
//           }
//         },
//         { $sort: { TotalImpressions: -1 } }
//       ]);
//     };

//     const month2Data = await getSummaryByMonth(month2Str);
//     const month1Data = await getSummaryByMonth(month1Str);

//     const getTotal = (data, field) =>
//       data.reduce((sum, item) => sum + (item[field] || 0), 0);

//     const response = {
//       success: true,
//       [`TotalImpressions${month2Label}`]: getTotal(month2Data, 'TotalImpressions'),
//       [`TotalClicks${month2Label}`]: getTotal(month2Data, 'TotalClicks'),
//       [`TotalAddToCart${month2Label}`]: getTotal(month2Data, 'TotalAddToCart'),

//       [`TotalImpressions${month1Label}`]: getTotal(month1Data, 'TotalImpressions'),
//       [`TotalClicks${month1Label}`]: getTotal(month1Data, 'TotalClicks'),
//       [`TotalAddToCart${month1Label}`]: getTotal(month1Data, 'TotalAddToCart'),

//       [month2Label.toLowerCase()]: month2Data,
//       [month1Label.toLowerCase()]: month1Data
//     };

//     res.status(200).json(response);
//   } catch (err) {
//     console.error("Aggregation Error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch summary",
//       error: err.message
//     });
//   }
// });


module.exports = router;
