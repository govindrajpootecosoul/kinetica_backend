const xlsx = require('xlsx');
const fs = require('fs');

function excelDateToYYYYMM(serial) {
  const excelEpoch = new Date(1899, 11, 30);
  const date = new Date(excelEpoch.getTime() + Math.floor(serial) * 86400000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

async function handleExcelUploadpnl(filePath, Model) {
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

module.exports = { handleExcelUploadpnl };
