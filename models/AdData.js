const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
  Ad_Sales: Number,
  Ad_Spend: Number,
  SKU: String,
  Year_Month: Date
});

module.exports = mongoose.model('Data', dataSchema);
