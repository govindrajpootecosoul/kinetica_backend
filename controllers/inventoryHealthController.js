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
      SKU: row["SKU"],
      Country: row["Country"],
      afn_warehouse_quantity: Number(row["afn-warehouse-quantity"] || 0),
      afn_fulfillable_quantity: Number(row["afn-fulfillable-quantity"] || 0),
      afn_unsellable_quantity: Number(row["afn-unsellable-quantity"] || 0),
      afn_reserved_quantity: Number(row["afn-reserved-quantity"] || 0),
      afn_total_quantity: Number(row["afn-total-quantity"] || 0),
      afn_inbound_working_quantity: Number(row["afn-inbound-working-quantity"] || 0),
      afn_inbound_shipped_quantity: Number(row["afn-inbound-shipped-quantity"] || 0),
      afn_inbound_receiving_quantity: Number(row["afn-inbound-receiving-quantity"] || 0),
      afn_researching_quantity: Number(row["afn-researching-quantity"] || 0),
      afn_reserved_future_supply: Number(row["afn-reserved-future-supply"] || 0),
      afn_future_supply_buyable: Number(row["afn-future-supply-buyable"] || 0),
      Amazon_Reserved: Number(row["Amazon Reserved"] || 0),
      Customer_reserved: Number(row["Customer_reserved"] || 0),
      FC_Transfer: Number(row["FC_Transfer"] || 0),
      FC_Processing: Number(row["FC_Processing"] || 0),
      Date: formatDate(row["Date"]),
      healthy_inventory_level: row["healthy-inventory-level"],
      days_of_supply: Number(row["days-of-supply"] || 0),
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
      recommended_action: row["recommended-action"],
      estimated_cost_savings_of_recommended_actions: Number(row["estimated-cost-savings-of-recommended-actions"] || 0),
      estimated_storage_cost_next_month: Number(row["estimated-storage-cost-next-month"] || 0),
      estimated_ais_331_365_days: Number(row["estimated-ais-331-365-days"] || 0),
      estimated_ais_365_plus_days: Number(row["estimated-ais-365-plus-days"] || 0),
      quantity_to_be_charged_ais_241_270_days: Number(row["quantity-to-be-charged-ais-241-270-days"] || 0),
      estimated_ais_241_270_days: Number(row["estimated-ais-241-270-days"] || 0),
      quantity_to_be_charged_ais_271_300_days: Number(row["quantity-to-be-charged-ais-271-300-days"] || 0),
      estimated_ais_271_300_days: Number(row["estimated-ais-271-300-days"] || 0),
      quantity_to_be_charged_ais_301_330_days: Number(row["quantity-to-be-charged-ais-301-330-days"] || 0),
      estimated_ais_301_330_days: Number(row["estimated-ais-301-330-days"] || 0),
    }));

    await InventoryHealth.insertMany(formatted);
    fs.unlinkSync(filePath);
    res.status(200).json({ message: "Inventory health uploaded successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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

exports.getInventoryHealth = async (req, res) => {
  try {
    const { sku } = req.query;
    const filter = {};

    if (sku) {
      filter.SKU = sku;
    }

    const data = await InventoryHealth.find(filter);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
