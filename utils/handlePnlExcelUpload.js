// // utils/handlePnlExcelUpload.js
// const xlsx = require('xlsx');

// async function handlePnlExcelUpload(filePath, Model) {
//   try {
//     const workbook = xlsx.readFile(filePath);
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];

//     const rawData = xlsx.utils.sheet_to_json(sheet, { defval: '' });

//     const mappedData = rawData
//       .filter(row => row['SKU'] && row['Year-Month']) // Optional: skip incomplete rows
//       .map((row) => ({
//         SKU: row['SKU'] || '',
//         DealFee: parseFloat(row['Deal Fee']) || 0,
//         FBAInventoryFee: parseFloat(row['FBA Inventory Fee']) || 0,
//         FBAReimbursement: parseFloat(row['FBA Reimbursement']) || 0,
//         Liquidations: parseFloat(row['Liquidations']) || 0,
//         OtherMarketingExpenses: parseFloat(row['Other marketing Expenses']) || 0,
//         StorageFee: parseFloat(row['Storage Fee']) || 0,
//         TotalSales: parseFloat(row['Total Sales']) || 0,
//         TotalUnits: parseInt(row['Total Units']) || 0,
//         fbaFees: parseFloat(row['fba fees']) || 0,
//         promotionalRebates: parseFloat(row['promotional rebates']) || 0,
//         sellingFees: parseFloat(row['selling fees']) || 0,
//         YearMonth: row['Year-Month'] || '',
//         Channel: row['Channel'] || '',
//         ProductCoGS: parseFloat(row['Product CoGS']) || 0,
//         Cogs: parseFloat(row['Cogs']) || 0,
//         CM1: parseFloat(row['CM1']) || 0,
//         heads_CM2: parseFloat(row['heads_CM2']) || 0,
//         CM2: parseFloat(row['CM2']) || 0,
//         Spend: parseFloat(row['Spend']) || 0,
//         heads_CM3: parseFloat(row['heads_CM3']) || 0,
//         CM3: parseFloat(row['CM3']) || 0
//       }));

//     const inserted = await Model.insertMany(mappedData, { ordered: false });
//     return inserted.length;
//   } catch (err) {
//     console.error("Error in handlePnlExcelUpload:", err);
//     throw err;
//   }
// }

// module.exports = handlePnlExcelUpload;
