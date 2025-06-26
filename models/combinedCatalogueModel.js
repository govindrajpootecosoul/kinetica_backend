const mongoose = require("mongoose");

const combinedCatalogueSchema = new mongoose.Schema({
  ASIN: String,
  Impressions: Number,
  Clicks: Number,
  AddToCart: Number,
  YearMonth: String, // format: YYYY-MM
  ProductCategory: String,
  SKU: String,
  ProductName: String,
  CTR: Number
});

module.exports = mongoose.model("CombinedCatalogues", combinedCatalogueSchema);
