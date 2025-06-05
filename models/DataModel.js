
const mongoose = require('mongoose');

// Schema that accepts any structure
const dataSchema = new mongoose.Schema({}, { strict: false });
const pnldataSchema = new mongoose.Schema({}, { strict: false });
const skudataSchema = new mongoose.Schema({}, { strict: false });

const UkInventorys = mongoose.model('UkInventorys', dataSchema, 'UkInventorys');
const Pnl = mongoose.model('pnl', pnldataSchema, 'pnl');
const Sku = mongoose.model('sku', skudataSchema, 'sku');

// Export both models
module.exports = {
  UkInventorys,
  Pnl,
  Sku

};
