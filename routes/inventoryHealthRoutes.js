const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const {
  uploadInventoryHealth,
  getInventoryHealth,
  getWHStockSumByCategory,
  getTopUnderstockSKUsByDOS,
  getTopOverstockSKUsByDOS,
} = require("../controllers/inventoryHealthController");

router.post("/upload", upload.single("file"), uploadInventoryHealth);
router.get("/", getInventoryHealth);
router.get("/productcategorysum", getWHStockSumByCategory);
router.get("/productunders", getTopUnderstockSKUsByDOS);
router.get("/productoversku", getTopOverstockSKUsByDOS);

module.exports = router;
