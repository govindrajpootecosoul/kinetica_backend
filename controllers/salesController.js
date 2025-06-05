//Upload & Filter Logic:
const xlsx = require("xlsx");
const SalesRecord = require("../models/SalesRecord");
const fs = require("fs");

exports.uploadExcel = async (req, res) => {
  try {
    const file = req.file.path;
    const workbook = xlsx.readFile(file);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const formattedData = data.map(row => {
      // Convert 'purchase-date' to YYYY-MM-DD format as a string
      let purchaseDate = row["purchase-date"];

      if (purchaseDate) {
        // If purchaseDate is a number (Excel stores dates as numbers)
        if (typeof purchaseDate === 'number') {
          const dateObj = new Date((purchaseDate - (25567 + 2)) * 86400 * 1000);  // Convert Excel date to JS Date
          purchaseDate = dateObj.toISOString().slice(0, 10); // Extract YYYY-MM-DD from ISO string
        } else {
          const dateObj = new Date(purchaseDate);
          if (!isNaN(dateObj.getTime())) {
            purchaseDate = dateObj.toISOString().slice(0, 10); // Extract YYYY-MM-DD from ISO string
          } else {
            purchaseDate = null; // If invalid date, set to null
          }
        }
      }

      return {
        orderID: row["Order_ID"],
        purchaseDate: purchaseDate, // Save the date as a string in YYYY-MM-DD format
        orderStatus: row["order-status"],
        SKU: row["SKU"],
        asin: row["asin"],
        productName: row["product-name"],
        quantity: Number(row["Quantity"]),
        totalSales: Number(row["Total_Sales"]),
        currency: row["currency"],
        monthYear: row["Month-Year"],
        pincodeNew: row["Pincode_new"],
        averageUnitPriceAmount: Number(row["averageUnitPriceAmount"]),
        cityX: row["City_x"],
        stateX: row["State_x"],
        pincodeY: row["Pincode_y"],
        city: row["City"],
        state: row["State"],
        country: row["Country"]
      };
    });

    // Insert the data into the database
    await SalesRecord.insertMany(formattedData);
    fs.unlinkSync(file);

    res.status(200).json({ message: "Excel data uploaded successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getSales = async (req, res) => {
  try {
    const { sku, filterType, fromDate, toDate } = req.query;

    const query = {};
    const today = new Date();
    let startDate, endDate;

    // Handle filterType
    switch (filterType) {
      case "today":
        startDate = new Date(today.setHours(0, 0, 0, 0));
        endDate = new Date(today.setHours(23, 59, 59, 999));
        break;

      case "week":
        const day = today.getDay();
        startDate = new Date(today);
        startDate.setDate(today.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;

      case "lastmonth":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  
        startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case "year":
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;

      case "custom":
        if (fromDate && toDate) {
          startDate = new Date(fromDate);
          endDate = new Date(toDate);
          endDate.setHours(23, 59, 59, 999);
        }
        break;

      case "last30days":
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "monthtodate":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;

      case "yeartodate":
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;

      case "6months":
        startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
    }

    // Add date and SKU filter
    if (startDate && endDate) {
      query.purchaseDate = { $gte: startDate, $lte: endDate };
    }

    if (sku) {
      query.SKU = { $in: sku.split(",").map(s => s.trim()) };
    }

    const records = await SalesRecord.find(query);

    if (!records.length) {
      return res.status(404).json({ message: "No records found." });
    }

    // Group and format response
    const result = {};

    records.forEach(record => {
      const SKU = record.SKU;
      const quantity = Number(record.quantity) || 0;
      const totalSales = Number(record.totalSales) || 0;

      if (!result[SKU]) {
        result[SKU] = {
          SKU: SKU,
          totalQuantity: 0,
          totalSales: 0,
          purchaseDate: record.purchaseDate,
          asin: record.asin,
          productName: record.productName,
          monthYear: record.monthYear,
          pincodeNew: record.pincodeNew,
          averageUnitPriceAmount: Number(record.averageUnitPriceAmount),
          cityX: record.cityX,
          stateX: record.stateX,
          city: record.city,
          state: record.state,
          country: record.country
        };
      }

      result[SKU].totalQuantity += quantity;
      result[SKU].totalSales += totalSales;
    });

    res.json(Object.values(result));
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: error.message });
  }
};






/// for sales resion wise list  and executive list
//complete executive screen api






exports.getresionsale = async (req, res) => {
  try {
    const { sku, filterType = "6months", fromDate, toDate, state, city } = req.query;

    const today = new Date();
    const query = {};

    const setStartOfDay = date => new Date(date.setHours(0, 0, 0, 0));
    const setEndOfDay = date => new Date(date.setHours(23, 59, 59, 999));
    const addDays = (date, days) => new Date(date.getTime() + days * 86400000);

    let currentStartDate, currentEndDate, previousStartDate, previousEndDate;

    switch (filterType) {
      case "today":
        currentStartDate = setStartOfDay(new Date(today));
        currentEndDate = setEndOfDay(new Date(today));
        previousStartDate = setStartOfDay(addDays(currentStartDate, -1));
        previousEndDate = setEndOfDay(previousStartDate);
        break;

      case "week":
        const dayOfWeek = today.getDay();
        currentStartDate = setStartOfDay(addDays(today, -dayOfWeek));
        currentEndDate = setEndOfDay(new Date());
        previousStartDate = setStartOfDay(addDays(currentStartDate, -7));
        previousEndDate = setEndOfDay(addDays(previousStartDate, 6));
        break;

      case "lastmonth":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        currentStartDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        currentEndDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59, 999);
        previousStartDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, 1);
        previousEndDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 0, 23, 59, 59, 999);
        break;

      case "year":
        currentStartDate = new Date(today.getFullYear(), 0, 1);
        currentEndDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        previousStartDate = new Date(today.getFullYear() - 1, 0, 1);
        previousEndDate = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;

      case "custom":
        if (fromDate && toDate) {
          currentStartDate = new Date(fromDate);
          currentEndDate = new Date(toDate);
          const diff = currentEndDate - currentStartDate;
          previousEndDate = new Date(currentStartDate.getTime() - 1);
          previousStartDate = new Date(previousEndDate.getTime() - diff);
        } else {
          return res.status(400).json({ error: "Custom range requires both fromDate and toDate" });
        }
        break;

      case "last30days":
        currentStartDate = setStartOfDay(addDays(today, -29));
        currentEndDate = setEndOfDay(today);
        previousStartDate = setStartOfDay(addDays(currentStartDate, -30));
        previousEndDate = setEndOfDay(addDays(currentStartDate, -1));
        break;

      case "monthtodate":
        currentStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
        currentEndDate = setEndOfDay(today);
        const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        previousStartDate = new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), 1);
        previousEndDate = setEndOfDay(prevMonthEnd);
        break;

      case "yeartodate":
        currentStartDate = new Date(today.getFullYear(), 0, 1);
        currentEndDate = setEndOfDay(today);
        previousStartDate = new Date(today.getFullYear() - 1, 0, 1);
        previousEndDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate(), 23, 59, 59, 999);
        break;

      case "6months":
      default:
        currentStartDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        currentEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        previousStartDate = new Date(today.getFullYear(), today.getMonth() - 11, 1);
        previousEndDate = new Date(today.getFullYear(), today.getMonth() - 6 + 1, 0, 23, 59, 59, 999);
        break;
    }

    if (sku) query.SKU = { $in: sku.split(",").map(s => s.trim()) };
    if (state) query.state = state;
    if (city) query.city = city;

    const currentRecords = await SalesRecord.find({
      ...query,
      purchaseDate: { $gte: currentStartDate, $lte: currentEndDate }
    });

    if (!currentRecords.length) {
      return res.status(404).json({ message: "No records found for selected range." });
    }

    let breakdown = {}, totalQuantity = 0, totalSales = 0;

    currentRecords.forEach(record => {
      const date = new Date(record.purchaseDate);
      if (date < currentStartDate || date > currentEndDate) return; // ✅ Safety check

      const key = ["today", "week", "last30days", "monthtodate", "yeartodate"].includes(filterType)
        ? date.toISOString().split('T')[0]
        : date.toLocaleString('default', { month: 'long', year: 'numeric' });

      const quantity = Number(record.quantity) || 0;
      const sales = Number(record.totalSales) || 0;

      totalQuantity += quantity;
      totalSales += sales;

      if (!breakdown[key]) {
        breakdown[key] = { date: key, totalQuantity: 0, totalSales: 0 };
      }

      breakdown[key].totalQuantity += quantity;
      breakdown[key].totalSales += sales;
    });

    const result = {
      totalQuantity,
      totalSales,
      breakdown: Object.values(breakdown).sort((a, b) => {
        return Date.parse(a.date) - Date.parse(b.date);
      })
    };

    if (previousStartDate && previousEndDate) {
      const previousRecords = await SalesRecord.find({
        ...query,
        purchaseDate: { $gte: previousStartDate, $lte: previousEndDate }
      });

      let prevTotalQuantity = 0, prevTotalSales = 0;

      previousRecords.forEach(record => {
        prevTotalQuantity += Number(record.quantity) || 0;
        prevTotalSales += Number(record.totalSales) || 0;
      });

      const quantityDiff = totalQuantity - prevTotalQuantity;
      const salesDiff = totalSales - prevTotalSales;

      result.comparison = {
        previousTotalQuantity: prevTotalQuantity,
        previousTotalSales: prevTotalSales,
        quantityChangePercent: `${Math.abs(
          prevTotalQuantity ? ((quantityDiff / prevTotalQuantity) * 100).toFixed(2) : 100
        )}% ${quantityDiff >= 0 ? 'Profit' : 'Loss'}`,
        salesChangePercent: `${Math.abs(
          prevTotalSales ? ((salesDiff / prevTotalSales) * 100).toFixed(2) : 100
        )}% ${salesDiff >= 0 ? 'Profit' : 'Loss'}`
      };
    }

    res.json(result);

  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: error.message });
  }
};
