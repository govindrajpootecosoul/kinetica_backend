const Skucity = require('../models/SkucityModel');

const getAllSKUs = async (req, res) => {
  const { q } = req.query;
  let filter = {};
  if (q) {
    filter.SKU = { $regex: q, $options: 'i' }; // case-insensitive match
  }

  try {
    const skus = await Skucity.find(filter).distinct('SKU');
    res.json(skus);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch SKUs' });
  }
};

const getAllStates = async (req, res) => {
  const { q } = req.query;
  let filter = {};
  if (q) {
    filter.State = { $regex: q, $options: 'i' };
  }

  try {
    const states = await Skucity.find(filter).distinct('State');
    res.json(states);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch States' });
  }
};

const getAllCities = async (req, res) => {
  const { q } = req.query;
  let filter = {};
  if (q) {
    filter.City = { $regex: q, $options: 'i' };
  }

  try {
    const cities = await Skucity.find(filter).distinct('City');
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Cities' });
  }
};

module.exports = { getAllSKUs, getAllStates, getAllCities };
