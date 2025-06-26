const mongoose = require('mongoose');

const subscribeSaveSchema = new mongoose.Schema({
  MonthYear: String, // Expected format: "2025-06"
  SKU: String,
  Discount_with_tax: Number,
  Quantity: Number,
  Subscribers_Total_Discount: Number,
  Subscribers_Total_Discount_with_tax: Number,
  Total_Subscribers_sales_with_tax: Number,
  City: String,
  State: String,
  Country: String,
  Product_Category: String,
  Product_Name: String,
  Subscriptions_Count: Number
}, 
//{ timestamps: true }
);

module.exports = mongoose.model('SubscribeSave', subscribeSaveSchema);
