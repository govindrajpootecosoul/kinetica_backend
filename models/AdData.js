// const mongoose = require('mongoose');

// const dataSchema = new mongoose.Schema({
//   Ad_Sales: Number,
//   Ad_Spend: Number,
//   SKU: String,
//   Year_Month: Date
// });

// module.exports = mongoose.model('Data', dataSchema);


const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
  Ad_Sales: Number,
  Ad_Spend: Number,
  Total_Revenue: Number,
  SKU: String,
  Year_Month: Date // maps to "Year-Month" column in data
});

module.exports = mongoose.model('Data', dataSchema);
