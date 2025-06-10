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
        productName: row["Product Name"],
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

    let currentStartDate, currentEndDate;

    switch (filterType) {
      case "today":
        currentStartDate = setStartOfDay(new Date(today));
        currentEndDate = setEndOfDay(new Date(today));
        break;

      case "week":
        const dayOfWeek = today.getDay();
        currentStartDate = setStartOfDay(addDays(today, -dayOfWeek));
        currentEndDate = setEndOfDay(new Date());
        break;

      case "lastmonth":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        currentStartDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        currentEndDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case "year":
        currentStartDate = new Date(today.getFullYear(), 0, 1);
        currentEndDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;

      case "custom":
        if (fromDate && toDate) {
          const [fromYear, fromMonth] = fromDate.split("-").map(Number);
          const [toYear, toMonth] = toDate.split("-").map(Number);
          currentStartDate = new Date(fromYear, fromMonth - 1, 1);
          currentEndDate = new Date(toYear, toMonth, 0, 23, 59, 59, 999);
        } else {
          return res.status(400).json({ error: "Custom range requires both fromDate and toDate in YYYY-MM format" });
        }
        break;

      case "last30days":
        currentStartDate = setStartOfDay(addDays(today, -29));
        currentEndDate = setEndOfDay(today);
        break;

      case "monthtodate":
        currentStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
        currentEndDate = setEndOfDay(today);
        break;

      case "yeartodate":
        currentStartDate = new Date(today.getFullYear(), 0, 1);
        currentEndDate = setEndOfDay(today);
        break;

      case "6months":
      default:
        currentStartDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        currentEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
    }

    // Previous period calculation
    let previousEndDate = new Date(currentStartDate.getTime() - 1);
    let duration = (currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24) - 1;
    let previousStartDate = new Date(previousEndDate.getTime() - (duration - 1) * 86400000);

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

    let breakdown = {}, totalQuantity = 0, totalSales = 0, totalOrders = 0, totalAdSales = 0;
    let orderIdsSet = new Set(); // ✅ For unique orderIds

    currentRecords.forEach(record => {
      const date = new Date(record.purchaseDate);
      if (date < currentStartDate || date > currentEndDate) return;

      const key = date.toISOString().split('T')[0];
      const quantity = Number(record.quantity) || 0;
      const sales = Number(record.totalSales) || 0;
      const orderCount = Number(record.orderCount) || 0;
      const adSales = Number(record.adSales) || 0;
      const orderId = record.orderId;

      if (orderId) orderIdsSet.add(orderId); // ✅ Track unique orderIds

      totalQuantity += quantity;
      totalSales += sales;
      totalOrders += orderCount;
      totalAdSales += adSales;

      if (!breakdown[key]) {
        breakdown[key] = {
          date: key,
          totalQuantity: 0,
          totalSales: 0,
          orderCount: 0,
          adSales: 0,
          organicSales: 0
        };
      }

      breakdown[key].totalQuantity += quantity;
      breakdown[key].totalSales += sales;
      breakdown[key].orderCount += orderCount;
      breakdown[key].adSales += adSales;
      breakdown[key].organicSales += (sales - adSales);
    });

    const result = {
      totalQuantity,
      totalSales,
      totalUniqueOrders: orderIdsSet.size, // ✅ Add total unique orders
      breakdown: Object.values(breakdown).sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    };

    // 🔄 Previous period comparison
    const previousRecords = await SalesRecord.find({
      ...query,
      purchaseDate: { $gte: previousStartDate, $lte: previousEndDate }
    });

    let prevTotalQuantity = 0, prevTotalSales = 0, prevTotalOrders = 0, prevAdSales = 0;
    let prevOrderIdsSet = new Set(); // ✅ For unique orderIds (previous)

    previousRecords.forEach(record => {
      const quantity = Number(record.quantity) || 0;
      const sales = Number(record.totalSales) || 0;
      const orderCount = Number(record.orderCount) || 0;
      const adSales = Number(record.adSales) || 0;
      const orderId = record.orderId;

      if (orderId) prevOrderIdsSet.add(orderId); // ✅ Track previous unique orderIds

      prevTotalQuantity += quantity;
      prevTotalSales += sales;
      prevTotalOrders += orderCount;
      prevAdSales += adSales;
    });

    const quantityDiff = totalQuantity - prevTotalQuantity;
    const salesDiff = totalSales - prevTotalSales;
    const currentAOV = totalOrders ? totalSales / totalOrders : 0;
    const previousAOV = prevTotalOrders ? prevTotalSales / prevTotalOrders : 0;
    const aovDiff = currentAOV - previousAOV;
    const currentOrganicSales = totalSales - totalAdSales;
    const previousOrganicSales = prevTotalSales - prevAdSales;
    const organicDiff = currentOrganicSales - previousOrganicSales;

    result.comparison = {
      currentPeriod: {
        startDate: currentStartDate.toISOString().split('T')[0],
        endDate: currentEndDate.toISOString().split('T')[0],
      },
      previousPeriod: {
        startDate: previousStartDate.toISOString().split('T')[0],
        endDate: previousEndDate.toISOString().split('T')[0],
      },
      previousTotalQuantity: prevTotalQuantity,
      previousTotalSales: prevTotalSales,
      previousTotalUniqueOrders: prevOrderIdsSet.size, // ✅
      quantityChangePercent: `${Math.abs(
        prevTotalQuantity ? ((quantityDiff / prevTotalQuantity) * 100).toFixed(2) : 100
      )}% ${quantityDiff >= 0 ? 'Profit' : 'Loss'}`,
      salesChangePercent: `${Math.abs(
        prevTotalSales ? ((salesDiff / prevTotalSales) * 100).toFixed(2) : 100
      )}% ${salesDiff >= 0 ? 'Profit' : 'Loss'}`,
      aovChangePercent: `${Math.abs(
        previousAOV ? ((aovDiff / previousAOV) * 100).toFixed(2) : 100
      )}% ${aovDiff >= 0 ? 'Profit' : 'Loss'}`,
      organicSalesChangePercent: `${Math.abs(
        previousOrganicSales ? ((organicDiff / previousOrganicSales) * 100).toFixed(2) : 100
      )}% ${organicDiff >= 0 ? 'Profit' : 'Loss'}`,
      uniqueOrdersChangePercent: `${Math.abs(
        prevOrderIdsSet.size ? (((orderIdsSet.size - prevOrderIdsSet.size) / prevOrderIdsSet.size) * 100).toFixed(2) : 100
      )}% ${orderIdsSet.size >= prevOrderIdsSet.size ? 'Profit' : 'Loss'}`
    };


        const currentAOVQty = totalQuantity ? totalSales / totalQuantity : 0;
    const previousAOVQty = prevTotalQuantity ? prevTotalSales / prevTotalQuantity : 0;
    const aovQtyDiff = currentAOVQty - previousAOVQty;

    result.comparison.aovChangePercentQty = `${Math.abs(
      previousAOVQty ? ((aovQtyDiff / previousAOVQty) * 100).toFixed(2) : 100
    )}% ${aovQtyDiff >= 0 ? 'Profit' : 'Loss'}`;


    res.json(result);

  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: error.message });
  }
}; 