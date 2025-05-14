const mongoose = require('mongoose');

const SkucitySchema = new mongoose.Schema({
  SKU: String,
  State: String,
  City: String,
}, { timestamps: true });

SkucitySchema.index({ SKU: 1, State: 1, City: 1 }, { unique: true });

module.exports = mongoose.model('Skucity', SkucitySchema);
