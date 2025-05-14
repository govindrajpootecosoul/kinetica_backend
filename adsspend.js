const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const moment = require('moment');

// Initialize Express app
const app = express();
const port = 4000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/datafromsheet', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Create a schema for the data
const dataSchema = new mongoose.Schema({
  Ad_Sales: Number,
  Ad_Spend: Number,
  SKU: String,
  Year_Month: String
});

// Create a model for the schema
const DataModel = mongoose.model('Data', dataSchema);

// Set up file storage engine for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Middleware to serve static files from 'uploads' folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Function to handle file upload and data insertion into the database
app.post('/api/upload', upload.single('file'), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  // Read the Excel file
  const workbook = xlsx.readFile(file.path);
  const sheet_name_list = workbook.SheetNames;
  const worksheet = workbook.Sheets[sheet_name_list[0]];
  const data = xlsx.utils.sheet_to_json(worksheet);

  // Insert data into MongoDB
  DataModel.insertMany(data)
    .then(() => {
      res.send('Data uploaded successfully!');
    })
    .catch(err => {
      res.status(500).send('Error uploading data: ' + err.message);
    });
});

// Helper function to get the date ranges
function getDateRange(rangeType) {
  const today = moment();
  let startDate;

  switch (rangeType) {
    case 'today':
      startDate = today.startOf('day');
      break;
    case 'thisweek':
      startDate = today.startOf('week');
      break;
    case 'last30days':
      startDate = today.subtract(30, 'days');
      break;
    case 'monthtodate':
      startDate = today.startOf('month');
      break;
    case 'last6months':
      startDate = today.subtract(6, 'months');
      break;
    case 'yeartodate':
      startDate = today.startOf('year');
      break;
    case 'custom':
      // Custom date range will be handled with startDate and endDate from query
      return null; 
    default:
      throw new Error('Invalid range type');
  }

  return startDate;
}

// Function to handle data filtering based on the provided range and SKU
app.get('/api/filterData', async (req, res) => {
  const { range, sku, startDate, endDate } = req.query;

  try {
    // If custom range is provided
    let filterDateRange;
    if (range === 'custom' && startDate && endDate) {
      filterDateRange = { Year_Month: { $gte: startDate, $lte: endDate } };
    } else {
      const dateRange = getDateRange(range);
      if (dateRange) {
        filterDateRange = { Year_Month: { $gte: dateRange.format('YYYY-MM-DD') } };
      }
    }

    // Fetch data from the database based on the filter
    const filter = {};
    if (filterDateRange) {
      filter.Year_Month = filterDateRange;
    }
    if (sku) {
      filter.SKU = sku;
    }

    const data = await DataModel.find(filter);

    // Calculate sum of Ad_Sales and Ad_Spend
    let totalAdSales = 0;
    let totalAdSpend = 0;
    data.forEach(item => {
      totalAdSales += item.Ad_Sales;
      totalAdSpend += item.Ad_Spend;
    });

    res.json({
      totalAdSales,
      totalAdSpend,
      data
    });
  } catch (error) {
    res.status(500).send('Error fetching data: ' + error.message);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
