// const xlsx = require('xlsx');

// function parseExcel(filePath) {
//   const workbook = xlsx.readFile(filePath);
//   const sheet = workbook.Sheets[workbook.SheetNames[0]];
//   const data = xlsx.utils.sheet_to_json(sheet);

//   return data.map(row => {
//     const raw = row['Year-Month'] || row['Year_Month'] || row.date;
//     let parsedDate = null;

//     if (typeof raw === 'string' && /^\d{4}-\d{2}$/.test(raw)) {
//       const [year, month] = raw.split('-').map(Number);
//       parsedDate = new Date(Date.UTC(year, month - 1, 1));
//     } else if (typeof raw === 'number') {
//       const excelEpoch = new Date(Date.UTC(1899, 11, 30));
//       parsedDate = new Date(excelEpoch.getTime() + raw * 86400000);
//     } else {
//       const tempDate = new Date(raw);
//       parsedDate = isNaN(tempDate.getTime()) ? null : tempDate;
//     }

//     return {
//       Ad_Sales: Number(row.Ad_Sales) || 0,
//       Ad_Spend: Number(row.Ad_Spend) || 0,
//       SKU: row.SKU || '',
//       Year_Month: parsedDate
//     };
//   }).filter(d => d.Year_Month);
// }

// module.exports = parseExcel;


const xlsx = require('xlsx');

function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  return data.map(row => {
    const rawDate = row['Year-Month'] || row['Year_Month'] || row.date;
    let parsedDate = null;

    if (typeof rawDate === 'string' && /^\d{4}-\d{2}$/.test(rawDate)) {
      const [year, month] = rawDate.split('-').map(Number);
      parsedDate = new Date(Date.UTC(year, month - 1, 1));
    } else if (typeof rawDate === 'number') {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      parsedDate = new Date(excelEpoch.getTime() + rawDate * 86400000);
    } else {
      const tempDate = new Date(rawDate);
      parsedDate = isNaN(tempDate.getTime()) ? null : tempDate;
    }

    return {
      Ad_Sales: Number(row.Ad_Sales) || 0,
      Ad_Spend: Number(row.Ad_Spend) || 0,
      Total_Revenue: Number(row.Total_Revenue) || 0,
      SKU: String(row.SKU || ''),
      Year_Month: parsedDate
    };
  }).filter(entry => entry.Year_Month);
}

module.exports = parseExcel;
