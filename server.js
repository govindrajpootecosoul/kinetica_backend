const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const adDataRoutes = require('./routes/adDataRoutes');
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI //|| "mongodb://localhost:27017/salesDB";

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

app.use("/api/sales", require("./routes/salesRoutes"));
app.use("/api/inventory", require("./routes/inventoryHealthRoutes"));

app.use(express.json());
app.use('/api',require("./routes/skuuploadRoute.js"));
app.use('/api',require("./routes/skucityRoute"));

app.use('/api', require('./routes/subscribeSaveRoutes'));
app.use('/api/data', require('./routes/combinedCatalogueRoutes'));


//app.use('/api',skucityRoute);
//router.get('/summary', adDataController.getAdData);

app.use('/api/data',require("./routes/adDataRoutes"));
// app.use(express.json());
// app.use('/api/data', adDataRoutes);


app.use('/api',require("./routes/excelRoutes.js"));
app.use(express.json());


// app.use('/api',require("./routes/pnlupload.route.js"));


app.get('/ads/callback', (req, res) => {
    const authCode = req.query.code;  // authorization code from OAuth provider
    const error = req.query.error;    // if any error

    if (error) {
        return res.status(400).json({
            success: false,
            message: `Error during authorization`,
            error: error
        });
    }

    if (!authCode) {
        return res.status(400).json({
            success: false,
            message: 'Authorization code is missing in callback URL'
        });
    }

    console.log('Authorization Code received:', authCode);


    res.json({
        success: true,
        message: 'Authorization Successful',
        code: authCode
    });
});



app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
