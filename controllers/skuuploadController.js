const XLSX = require('xlsx');
const Skucity = require('../models/SkucityModel');

const uploadExcel = async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  if (sheet.length === 0) return res.status(400).send('Sheet is empty.');

  const validKeys = ['SKU', 'State', 'City'];
  const foundKeys = Object.keys(sheet[0]).filter(key => validKeys.includes(key));

  if (foundKeys.length === 0) {
    return res.status(400).send('SKU, State, or City column not found.');
  }

  let records = sheet.map(row => {
    let entry = {};
    if (row.SKU) entry.SKU = row.SKU.toString().trim();
    if (row.State) entry.State = row.State.toString().trim();
    if (row.City) entry.City = row.City.toString().trim();
    return entry;
  }).filter(r => r.SKU || r.State || r.City);

  let inserted = 0;
  for (let rec of records) {
    try {
      await Skucity.updateOne(rec, { $setOnInsert: rec }, { upsert: true });
      inserted++;
    } catch (err) {
      // ignore duplicates
    }
  }

  res.send(`Upload complete. ${inserted} records added.`);
};

module.exports = { uploadExcel };
