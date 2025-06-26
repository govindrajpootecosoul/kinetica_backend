const xlsx = require("xlsx");
const fs = require("fs");
const InventoryHealth = require("../models/InventoryHealth");

exports.uploadInventoryHealth = async (req, res) => {
  try {
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const formatted = data.map(row => ({
      Date: formatDate(row["Date"]),
      Country: row["Country"],
      SKU: row["SKU"],
      Product_Category: row["Product Category"],
      Product_Name: row["Product Name"],
      Product_COGS: row["Product CoGS"],
      Type: row["Type"],
      WH_Stock_Value: Number(row["WH_Stock_Value"] || 0),
      Sellable_Stock_Value: Number(row["Sellable_Stock_Value"] || 0),
      afn_warehouse_quantity: Number(row["afn-warehouse-quantity"] || 0),
      afn_fulfillable_quantity: Number(row["afn-fulfillable-quantity"] || 0),
      afn_unsellable_quantity: Number(row["afn-unsellable-quantity"] || 0),
      afn_reserved_quantity: Number(row["afn-reserved-quantity"] || 0),
      afn_total_quantity: Number(row["afn-total-quantity"] || 0),
      Amazon_Reserved: Number(row["Amazon Reserved"] || 0),
      Customer_reserved: Number(row["Customer_reserved"] || 0),
      FC_Transfer: Number(row["FC_Transfer"] || 0),
      FC_Processing: Number(row["FC_Processing"] || 0),
      days_of_supply: Number(row["days-of-supply"] || 0),
      Days_In_Stock: Number(row["Days_In_Stock"] || 0),
      Days_Out_Of_Stock: Number(row["Days_Out_Of_Stock"] || 0),
      Total_Days: Number(row["Total_Days"] || 0),
      InStock_Rate: Number(row["InStock_Rate"] || 0),
      InStock_Rate_Percent: Number(row["InStock_Rate_Percent"] || 0),
      Last_30_Days_Unit_Sold: Number(row["Last_30_Days_Unit_Sold"] || 0),
      Avg_Unit_Sold_Qty: Number(row["Avg_Unit_Sold_Qty"] || 0),
      MTQ_overstock: Number(row["MTQ_overstock"] || 0),
      MTQ_understock: Number(row["MTQ_understock"] || 0),
      Stock_Status: row["Stock_Status"],
      inv_age_0_to_30_days: Number(row["inv-age-0-to-30-days"] || 0),
      inv_age_31_to_60_days: Number(row["inv-age-31-to-60-days"] || 0),
      inv_age_61_to_90_days: Number(row["inv-age-61-to-90-days"] || 0),
      inv_age_91_to_180_days: Number(row["inv-age-91-to-180-days"] || 0),
      inv_age_181_to_270_days: Number(row["inv-age-181-to-270-days"] || 0),
      inv_age_271_to_365_days: Number(row["inv-age-271-to-365-days"] || 0),
      inv_age_365_plus_days: Number(row["inv-age-365-plus-days"] || 0),
      units_shipped_t7: Number(row["units-shipped-t7"] || 0),
      units_shipped_t30: Number(row["units-shipped-t30"] || 0),
      units_shipped_t60: Number(row["units-shipped-t60"] || 0),
      units_shipped_t90: Number(row["units-shipped-t90"] || 0),
      estimated_storage_cost_next_month: Number(row["estimated-storage-cost-next-month"] || 0),
      quantity_to_be_charged_ais_241_270_days: Number(row["quantity-to-be-charged-ais-241-270-days"] || 0),
      estimated_ais_241_270_days: Number(row["estimated-ais-241-270-days"] || 0),
      quantity_to_be_charged_ais_271_300_days: Number(row["quantity-to-be-charged-ais-271-300-days"] || 0),
      estimated_ais_271_300_days: Number(row["estimated-ais-271-300-days"] || 0),
      quantity_to_be_charged_ais_301_330_days: Number(row["quantity-to-be-charged-ais-301-330-days"] || 0),
      estimated_ais_301_330_days: Number(row["estimated-ais-301-330-days"] || 0),
      estimated_cost_savings_of_recommended_actions: Number(row["estimated-cost-savings-of-recommended-actions"] || 0),
      estimated_ais_331_365_days: Number(row["estimated-ais-331-365-days"] || 0),
      estimated_ais_365_plus_days: Number(row["estimated-ais-365-plus-days"] || 0),
      Sale_Lost: Number(row["Sale_Lost"] || 0),
      Inbound_receiving_quantity: Number(row["afn-inbound-receiving-quantity"] || 0),
      DOS_2: Number(row["DOS_2"] || 0),
      Sell_thru: Number(row["Sell_thru"] || 0),
    }));

    // Clear old data
    await InventoryHealth.deleteMany({});

    // Insert new data
    await InventoryHealth.insertMany(formatted);

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    res.status(200).json({ message: "Inventory health uploaded successfully", data: formatted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




// exports.uploadInventoryHealth = async (req, res) => {
//   try {
//     const filePath = req.file.path;
//     const workbook = xlsx.readFile(filePath);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const data = xlsx.utils.sheet_to_json(sheet);

//     const formatted = data.map(row => ({
//       SKU: row["SKU"],
//       Country: row["Country"],
//       afn_warehouse_quantity: Number(row["afn-warehouse-quantity"] || 0),
//       afn_fulfillable_quantity: Number(row["afn-fulfillable-quantity"] || 0),
//       afn_unsellable_quantity: Number(row["afn-unsellable-quantity"] || 0),
//       afn_reserved_quantity: Number(row["afn-reserved-quantity"] || 0),
//       afn_total_quantity: Number(row["afn-total-quantity"] || 0),
//       afn_inbound_working_quantity: Number(row["afn-inbound-working-quantity"] || 0),
//       afn_inbound_shipped_quantity: Number(row["afn-inbound-shipped-quantity"] || 0),
//       afn_inbound_receiving_quantity: Number(row["afn-inbound-receiving-quantity"] || 0),
//       afn_researching_quantity: Number(row["afn-researching-quantity"] || 0),
//       afn_reserved_future_supply: Number(row["afn-reserved-future-supply"] || 0),
//       afn_future_supply_buyable: Number(row["afn-future-supply-buyable"] || 0),
//       Amazon_Reserved: Number(row["Amazon Reserved"] || 0),
//       Customer_reserved: Number(row["Customer_reserved"] || 0),
//       FC_Transfer: Number(row["FC_Transfer"] || 0),
//       FC_Processing: Number(row["FC_Processing"] || 0),
//       Date: formatDate(row["Date"]),
//       healthy_inventory_level: row["healthy-inventory-level"],
//       days_of_supply: Number(row["days-of-supply"] || 0),
//       inv_age_0_to_30_days: Number(row["inv-age-0-to-30-days"] || 0),
//       inv_age_31_to_60_days: Number(row["inv-age-31-to-60-days"] || 0),
//       inv_age_61_to_90_days: Number(row["inv-age-61-to-90-days"] || 0),
//       inv_age_91_to_180_days: Number(row["inv-age-91-to-180-days"] || 0),
//       inv_age_181_to_270_days: Number(row["inv-age-181-to-270-days"] || 0),
//       inv_age_271_to_365_days: Number(row["inv-age-271-to-365-days"] || 0),
//       inv_age_365_plus_days: Number(row["inv-age-365-plus-days"] || 0),
//       units_shipped_t7: Number(row["units-shipped-t7"] || 0),
//       units_shipped_t30: Number(row["units-shipped-t30"] || 0),
//       units_shipped_t60: Number(row["units-shipped-t60"] || 0),
//       units_shipped_t90: Number(row["units-shipped-t90"] || 0),
//       recommended_action: row["recommended-action"],
//       estimated_cost_savings_of_recommended_actions: Number(row["estimated-cost-savings-of-recommended-actions"] || 0),
//       estimated_storage_cost_next_month: Number(row["estimated-storage-cost-next-month"] || 0),
//       estimated_ais_331_365_days: Number(row["estimated-ais-331-365-days"] || 0),
//       estimated_ais_365_plus_days: Number(row["estimated-ais-365-plus-days"] || 0),
//       quantity_to_be_charged_ais_241_270_days: Number(row["quantity-to-be-charged-ais-241-270-days"] || 0),
//       estimated_ais_241_270_days: Number(row["estimated-ais-241-270-days"] || 0),
//       quantity_to_be_charged_ais_271_300_days: Number(row["quantity-to-be-charged-ais-271-300-days"] || 0),
//       estimated_ais_271_300_days: Number(row["estimated-ais-271-300-days"] || 0),
//       quantity_to_be_charged_ais_301_330_days: Number(row["quantity-to-be-charged-ais-301-330-days"] || 0),
//       estimated_ais_301_330_days: Number(row["estimated-ais-301-330-days"] || 0),
//       Days_In_Stock: Number(row["Days_In_Stock"] || 0),
//       Total_Days: Number(row["Total_Days"] || 0),
//       InStock_Rate: Number(row["InStock_Rate"] || 0),
//       InStock_Rate_Percent: Number(row["InStock_Rate_Percent"] || 0),
//       Last_30_Days_Unit_Sold: Number(row["Last_30_Days_Unit_Sold"] || 0),
//       Avg_Unit_Sold_Qty: Number(row["Avg_Unit_Sold_Qty"] || 0),
//       MTQ: Number(row["MTQ"] || 0),
//        Stock_Status: row["Stock_Status"],
//     }));

//     await InventoryHealth.insertMany(formatted);
//     fs.unlinkSync(filePath);
//     res.status(200).json({ message: "Inventory health uploaded successfully" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// function formatDate(dateVal) {
//   const d = new Date(dateVal);
//   if (isNaN(d.getTime())) return null;
//   return d.toISOString().split("T")[0];
// }

function formatDate(excelDate) {
  if (typeof excelDate === "number") {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString().split("T")[0];
  } else if (typeof excelDate === "string") {
    // Parse assuming DD/MM/YYYY
    const parts = excelDate.split("/").map(Number);
    if (parts[0] > 12) {
      // Treat as DD/MM/YYYY
      const [day, month, year] = parts;
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
    } else {
      // Treat as MM/DD/YYYY
      const [month, day, year] = parts;
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
    }
  } else {
    return null;
  }
}

// exports.getInventoryHealth = async (req, res) => {
//   try {
//     const { sku } = req.query;
//     const filter = {};

//     if (sku) {
//       filter.SKU = sku;
//     }

//     const data = await InventoryHealth.find(filter);
//     res.json(data);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


exports.getInventoryHealth = async (req, res) => {
  try {
    const { sku, productName, productCategory } = req.query;
    const filter = {};

    if (sku) {
      filter.SKU = sku;
    }

    if (productName) {
      filter.Product_Name = productName;
    }

    if (productCategory) {
      filter.Product_Category = productCategory;
    }

    const data = await InventoryHealth.find(filter);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getProductCategories = async (req, res) => {
  try {
    const categories = await InventoryHealth.distinct("Product_Category");
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductNames = async (req, res) => {
  try {
    const names = await InventoryHealth.distinct("Product_Name");
    res.json(names);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};





//const InventoryHealth = require("../models/InventoryHealth");

exports.getWHStockSumByCategory = async (req, res) => {
  try {
    const result = await InventoryHealth.aggregate([
      {
        $group: {
          _id: "$Product_Category",
          WH_Stock_Value: { $sum: "$WH_Stock_Value" },
        }
      },
      {
        $sort: { WH_Stock_Value: -1 }
      }
    ]);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



//under stock top list 
exports.getTopUnderstockSKUsByDOS = async (req, res) => {
  try {
    const result = await InventoryHealth.aggregate([
      {
        $match: {
          Stock_Status: { $regex: /^understock$/i },
          DOS_2: { $gt: 0 } 
          // Exclude zero
        }
      },
      {
        $sort: {
          DOS_2: 1 // Ascending = lowest first
        }
      },
      {
        $skip: 1 // ✅ Skip the first lowest
      },
      // {
      //   $limit: 5
      // },
      {
        $project: {
          _id: 0,
          SKU: 1,
          Product_Name: 1,
          Product_Category: 1,
          afn_warehouse_quantity: 1,
          afn_fulfillable_quantity: 1,
          DOS_2: 1,
          Stock_Status: 1
        }
      }
    ]);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//top overstock 
exports.getTopOverstockSKUsByDOS = async (req, res) => {
  try {
    const result = await InventoryHealth.aggregate([
      {
        $match: {
          Stock_Status: { $regex: /^overstock$/i },
         
        }
      },
      {
        $sort: {
          DOS_2: -1
        }
      },
      {
        $project: {
          _id: 0,
          SKU: 1,
          Product_Name: 1,
          Product_Category: 1,
          afn_warehouse_quantity: 1,
          afn_fulfillable_quantity: 1,
          DOS_2: 1,
          Stock_Status: 1
        }
      },
      // {
      //   $limit: 10
      // }
    ]);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//out of stock 
// exports.getActiveOOSSKUs = async (req, res) => {
//   try {
//     const result = await InventoryHealth.aggregate([
//       {
//         $match: {
//          // Stock_Status: { $regex: /^active$/i },
//           afn_warehouse_quantity: 0
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           SKU: 1,
//           Product_Category: 1,
//           Product_Name: 1,
//           afn_warehouse_quantity: 1,
//           afn_fulfillable_quantity: 1,
//           Days_Out_Of_Stock: 1 // Only if this field exists in your documents
//         }
//       }
//     ]);

//     res.status(200).json(result);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


exports.getActiveOOSSKUs = async (req, res) => {
  try {
    const result = await InventoryHealth.aggregate([
      {
        $match: {
          Stock_Status: { $in: ['Understock', 'Active'] }, // include both
          afn_fulfillable_quantity: { $eq: 0 },
         
        }
      },
      {
        $project: {
          _id: 0,
          SKU: 1,
          Product_Category: 1,
          Product_Name: 1,
          afn_fulfillable_quantity: 1,
          afn_warehouse_quantity: 1,
          Stock_Status: 1,
          Days_Out_Of_Stock: 1
        }
      },
      {
        $sort: { Days_Out_Of_Stock: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching out-of-stock SKUs",
      error: error.message
    });
  }
};


exports.getTopunder_SKU = async (req, res) => {
  try {
    const result = await InventoryHealth.aggregate([
      {
        $match: {
          Stock_Status: { $regex: /^understock$/i },
         
        }
      },
      {
        $sort: {
          DOS_2: -1
        }
      },
      {
        $project: {
          _id: 0,
          SKU: 1,
          Product_Name: 1,
          Product_Category: 1,
          afn_warehouse_quantity: 1,
          afn_fulfillable_quantity: 1,
          DOS_2: 1,
          Stock_Status: 1
        }
      },
      // {
      //   $limit: 10
      // }
    ]);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



