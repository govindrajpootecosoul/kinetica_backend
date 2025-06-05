// models/pnl.model.js
const mongoose = require('mongoose');

const pnlSchema = new mongoose.Schema({
  SKU: String,
  DealFee: Number,
  FBAInventoryFee: Number,
  FBAReimbursement: Number,
  Liquidations: Number,
  OtherMarketingExpenses: Number,
  StorageFee: Number,
  TotalSales: Number,
  TotalUnits: Number,
  fbaFees: Number,
  promotionalRebates: Number,
  sellingFees: Number,
  YearMonth: String,
  Channel: String,
  ProductCoGS: Number,
  Cogs: Number,
  CM1: Number,
  heads_CM2: Number,
  CM2: Number,
  Spend: Number,
  heads_CM3: Number,
  CM3: Number
}, { strict: true });

module.exports = mongoose.model('Pnl', pnlSchema);
