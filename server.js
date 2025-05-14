const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const adDataRoutes = require('./routes/adDataRoutes');
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI //|| "mongodb://localhost:27017/salesDB";

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

app.use("/api/sales", require("./routes/salesRoutes"));
app.use("/api/inventory", require("./routes/inventoryHealthRoutes"));
//make a upload api data upload from sheets eg. excel sheet in node js from postman
//get data from data base and pass params date today thisweek last30days eg(13may 13 april) monthtodate eg 1 may to cutrrent last6months yeartodate 1 jan to current and customedate range optional sku main logic is if user pass any date than show sum of Ad_Sales according to range and Ad_Spend and if passed sku than match sku and sho data 

app.use(express.json());
app.use('/api',require("./routes/skuuploadRoute.js"));
app.use('/api',require("./routes/skucityRoute"));

//app.use('/api',skucityRoute);
//router.get('/summary', adDataController.getAdData);

app.use('/api/data',require("./routes/adDataRoutes"));
// app.use(express.json());
// app.use('/api/data', adDataRoutes);


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
