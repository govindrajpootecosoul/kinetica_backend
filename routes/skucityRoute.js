const express = require('express');
const { getAllSKUs, getAllStates, getAllCities } = require('../controllers/skucityController');

const router = express.Router();

router.get('/sku', getAllSKUs);
router.get('/state', getAllStates);
router.get('/city', getAllCities);

module.exports = router;
