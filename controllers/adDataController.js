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

// exports.filterData = async (req, res) => {
//   try {
//     const { range, startDate, endDate, sku } = req.query;
//     const today = new Date();
//     let from = new Date('2000-01-01');
//     let to = today;

//     switch (range) {
//       case 'today':
//         from = new Date(today.setHours(0, 0, 0, 0));
//         to = new Date();
//         break;
//       case 'thisweek':
//         const day = today.getDay();
//         from = new Date(today);
//         from.setDate(today.getDate() - day);
//         from.setHours(0, 0, 0, 0);
//         break;
//       case 'last30days':
//         from = new Date(today.setDate(today.getDate() - 30));
//         break;
//       case 'monthtodate':
//         from = new Date(today.getFullYear(), today.getMonth(), 1);
//         break;
//       case 'last6months':
//         from = new Date(today.getFullYear(), today.getMonth() - 6, 1);
//         break;
//       case 'yeartodate':
//         from = new Date(today.getFullYear(), 0, 1);
//         break;
//       case 'custom':
//         from = new Date(startDate);
//         to = new Date(endDate);
//         break;
//     }

//     const query = {
//       Year_Month: { $gte: from, $lte: to }
//     };

//     if (sku) query.SKU = sku;

//     const data = await AdData.find(query);

//     const totalAdSales = data.reduce((sum, item) => sum + (item.Ad_Sales || 0), 0);
//     const totalAdSpend = data.reduce((sum, item) => sum + (item.Ad_Spend || 0), 0);
    

//     res.json({ totalAdSales, totalAdSpend, data });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Error filtering data' });
//   }
// };



exports.filterData = async (req, res) => {
  try {
    const { range, startDate, endDate, sku } = req.query;
    const today = new Date();
    let from = new Date('2000-01-01');
    let to = today;

    switch (range) {
      case 'today':
        from = new Date(today.setHours(0, 0, 0, 0));
        to = new Date();
        break;
      case 'thisweek':
        const day = today.getDay();
        from = new Date(today);
        from.setDate(today.getDate() - day);
        from.setHours(0, 0, 0, 0);
        break;
      case 'last30days':
        from = new Date(today.setDate(today.getDate() - 30));
        break;
      case 'monthtodate':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last6months':
        from = new Date(today.getFullYear(), today.getMonth() - 6, 1);
        break;
      case 'yeartodate':
        from = new Date(today.getFullYear(), 0, 1);
        break;
      case 'custom':
        from = new Date(startDate);
        to = new Date(endDate);
        break;
    }

    const query = {
      Year_Month: { $gte: from, $lte: to }
    };

    if (sku) query.SKU = sku;

    const data = await AdData.find(query);

    const totalAdSales = data.reduce((sum, item) => sum + (item.Ad_Sales || 0), 0);
    const totalAdSpend = data.reduce((sum, item) => sum + (item.Ad_Spend || 0), 0);
    const totalOrders = data.length;

    res.json({ totalAdSales, totalAdSpend, totalOrders, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error filtering data' });
  }
};
