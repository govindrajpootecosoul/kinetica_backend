const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const {
  uploadInventoryHealth,
  getInventoryHealth,
  getWHStockSumByCategory,
} = require("../controllers/inventoryHealthController");

router.post("/upload", upload.single("file"), uploadInventoryHealth);
router.get("/", getInventoryHealth);
router.get("/productcategorysum", getWHStockSumByCategory);

module.exports = router;
