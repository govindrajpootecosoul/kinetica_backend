const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadExcel, getSales,getresionsale} = require("../controllers/salesController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, "sales-" + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post("/upload", upload.single("file"), uploadExcel);
router.get("/", getSales);
router.get("/resion", getresionsale);

module.exports = router;
