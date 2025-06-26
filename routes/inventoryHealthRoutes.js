const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const {
  uploadInventoryHealth,
  getInventoryHealth,
getProductNames,
getProductCategories,


  getWHStockSumByCategory,
  getTopUnderstockSKUsByDOS,
  getTopOverstockSKUsByDOS,
  getActiveOOSSKUs,
  getTopunder_SKU,
} = require("../controllers/inventoryHealthController");

router.post("/upload", upload.single("file"), uploadInventoryHealth);
router.get("/", getInventoryHealth);
router.get("/productname", getProductNames);
router.get("/productcategory", getProductCategories);
router.get("/productcategorysum", getWHStockSumByCategory);
router.get("/productunders", getTopUnderstockSKUsByDOS);
router.get("/productoversku", getTopOverstockSKUsByDOS);
router.get("/out_of_stock_sku", getActiveOOSSKUs);
router.get("/understock_skulist", getTopunder_SKU);

module.exports = router;
