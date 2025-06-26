
//Mongoose Schema

const mongoose = require("mongoose");

const SalesRecordSchema = new mongoose.Schema({
  orderID: String,
  purchaseDate: Date,
  orderStatus: String,
  SKU: String,
  asin: String,
  productName: String,
  productCategory: String,
  quantity: Number,
  totalSales: Number,
  currency: String,
  monthYear: String,
  pincodeNew: String,
  averageUnitPriceAmount: Number,
  cityX: String,
  stateX: String,
  pincodeY: String,
  city: String,
  state: String,
  country: String,
});

module.exports = mongoose.model("SalesRecord", SalesRecordSchema);
