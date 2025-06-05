const AdData = require('../models/AdData');
const parseExcel = require('../utils/excelParser');
const fs = require('fs');

exports.uploadExcel = async (req, res) => {
  try {
    const parsedData = parseExcel(req.file.path);
    await AdData.insertMany(parsedData);
    fs.unlinkSync(req.file.path); // delete uploaded file
    res.status(200).json({ message: '✅ Data uploaded successfully!', count: parsedData.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error uploading file' });
  }
};

exports.filterData = async (req, res) => {
  try {
    const { range, startDate, endDate, sku } = req.query;

    const allowedRanges = ['custom', 'lastmonth', 'yeartodate', 'last6months', 'monthtodate', 'today'];
    if (!allowedRanges.includes(range)) {
      // Agar range invalid ho, toh zero response bhejo
      return res.json({
        totalAdSales: 0,
        totalAdSpend: 0,
        totalOrders: 0,
        data: []
      });
    }

    const now = new Date();
    let from = new Date('2000-01-01');
    let to = new Date();
 switch (range) {
      case 'today':
        from = new Date(now);
        from.setHours(0, 0, 0, 0);
        to = new Date(now);
        to.setHours(23, 59, 59, 999);
        break;

      case 'thisweek':
        from = new Date(now);
        from.setDate(now.getDate() - now.getDay()); // Sunday as start
        from.setHours(0, 0, 0, 0);
        to = new Date(now);
        to.setHours(23, 59, 59, 999);
        break;

      case 'last30days':
        from = new Date(now);
        from.setDate(now.getDate() - 30);
        from.setHours(0, 0, 0, 0);
        to = new Date(now);
        to.setHours(23, 59, 59, 999);
        break;

      case 'monthtodate':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        from.setHours(0, 0, 0, 0);
        to = new Date(now);
        to.setHours(23, 59, 59, 999);
        break;

      case 'last6months':
        from = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        from.setHours(0, 0, 0, 0);
        to = new Date(now);
        to.setHours(23, 59, 59, 999);
        break;

      case 'yeartodate':
        from = new Date(now.getFullYear(), 0, 1);
        from.setHours(0, 0, 0, 0);
        to = new Date(now);
        to.setHours(23, 59, 59, 999);
        break;

      case 'lastmonth':
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        from = new Date(lastMonthYear, lastMonth, 1);
        from.setHours(0, 0, 0, 0);
        to = new Date(lastMonthYear, lastMonth + 1, 0);
        to.setHours(23, 59, 59, 999);
        break;

      case 'custom':
        if (startDate && endDate) {
          // Validate YYYY-MM format (e.g., 2023-04)
          const validFormat = /^\d{4}-\d{2}$/;
          if (!validFormat.test(startDate) || !validFormat.test(endDate)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM' });
          }

          const [startYear, startMonth] = startDate.split('-').map(Number);
          const [endYear, endMonth] = endDate.split('-').map(Number);

          from = new Date(startYear, startMonth - 1, 1);
          from.setHours(0, 0, 0, 0);

          to = new Date(endYear, endMonth, 0);
          to.setHours(23, 59, 59, 999);
        } else {
          return res.status(400).json({ error: 'StartDate and EndDate are required for custom range' });
        }
        break;

      default:
        // If range is missing or unrecognized, use wide range default (2000-01-01 to now)
        from = new Date('2000-01-01');
        from.setHours(0, 0, 0, 0);
        to = new Date();
        to.setHours(23, 59, 59, 999);
        break;
    }

    console.log('Filter from:', from.toISOString(), 'to:', to.toISOString());

    const query = {
      Year_Month: { $gte: from, $lte: to }
    };

    if (sku) {
      query.SKU = sku;
    }

    const data = await AdData.find(query);

    const totalAdSales = data.reduce((sum, item) => sum + (item.Ad_Sales || 0), 0);
    const totalAdSpend = data.reduce((sum, item) => sum + (item.Ad_Spend || 0), 0);
    const totalOrders = data.length;

    res.json({ totalAdSales, totalAdSpend, totalOrders, data });

  } catch (err) {
    console.error('Error in filterData:', err);
    res.status(500).json({ error: 'Error filtering data' });
  }
};



