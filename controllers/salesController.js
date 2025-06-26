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
        productCategory: row["Product Category"],
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
    const { sku, filterType, fromDate, toDate, productCategory } = req.query;

    const query = {};
    const today = new Date();
    let startDate, endDate;

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
          const isMonthFormat = /^\d{4}-\d{2}$/;

          if (isMonthFormat.test(fromDate) && isMonthFormat.test(toDate)) {
            const [fromYear, fromMonth] = fromDate.split("-").map(Number);
            const [toYear, toMonth] = toDate.split("-").map(Number);

            startDate = new Date(fromYear, fromMonth - 1, 1, 0, 0, 0, 0);
            endDate = new Date(toYear, toMonth, 0, 23, 59, 59, 999);
          } else {
            startDate = new Date(fromDate);
            startDate.setHours(0, 0, 0, 0);

            endDate = new Date(toDate);
            endDate.setHours(23, 59, 59, 999);
          }
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
        startDate = new Date(today.getFullYear(), 0, 1); // Jan 1st of current year
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(); // Current date
        endDate.setHours(23, 59, 59, 999);
        break;

      case "6months":
        startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
    }

    if (startDate && endDate) {
      query.purchaseDate = { $gte: startDate, $lte: endDate };
    }

    if (sku) {
      query.SKU = { $in: sku.split(",").map(s => s.trim()) };
    }

    // ✅ Product category filter added here
    if (productCategory) {
      query.productCategory = productCategory;
    }

    const records = await SalesRecord.find(query);

    if (!records.length) {
      return res.status(404).json({ message: "No records found." });
    }

    const grouped = records.reduce((acc, record) => {
      const SKU = record.SKU;
      const quantity = Number(record.quantity) || 0;
      const totalSales = Number(record.totalSales) || 0;

      if (acc[SKU]) {
        acc[SKU].totalQuantity += quantity;
        acc[SKU].totalSales += totalSales;
      } else {
        acc[SKU] = {
          SKU,
          totalQuantity: quantity,
          totalSales: totalSales,
          records: [record]
        };
      }

      return acc;
    }, {});

    res.json(Object.values(grouped));
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: error.message });
  }
};


exports.getresionsale = async (req, res) => {
  try {
    const { sku, filterType = "6months", fromDate, toDate, state, city } = req.query;

    const today = new Date();
    const query = {};

    const setStartOfDay = date => new Date(date.setHours(0, 0, 0, 0));
    const setEndOfDay = date => new Date(date.setHours(23, 59, 59, 999));

    let currentStartDate, currentEndDate;
    let previousStartDate, previousEndDate;

    switch (filterType) {
      case "today": {
        currentStartDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        currentEndDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        previousStartDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        previousEndDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
        break;
      }

      case "week": {
        currentStartDate = new Date(today);
        currentStartDate.setDate(today.getDate() - today.getDay());
        currentStartDate = setStartOfDay(currentStartDate);
        currentEndDate = setEndOfDay(today);

        previousStartDate = new Date(currentStartDate);
        previousStartDate.setDate(currentStartDate.getDate() - 7);
        previousEndDate = new Date(currentEndDate);
        previousEndDate.setDate(currentEndDate.getDate() - 7);
        break;
      }

      case "monthtodate": {
        currentStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
        currentEndDate = setEndOfDay(today);

        const previousMonth = today.getMonth() - 1;
        const previousYear = previousMonth < 0 ? today.getFullYear() - 1 : today.getFullYear();
        const adjustedPrevMonth = (previousMonth + 12) % 12;

        previousStartDate = new Date(previousYear, adjustedPrevMonth, 1, 0, 0, 0, 0);
        previousEndDate = new Date(previousYear, adjustedPrevMonth + 1, 0, 23, 59, 59, 999);
        break;
      }

      case "lastmonth": {
        const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        currentStartDate = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1, 0, 0, 0, 0);
        currentEndDate = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0, 23, 59, 59, 999);

        const monthBeforeLast = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        previousStartDate = new Date(monthBeforeLast.getFullYear(), monthBeforeLast.getMonth(), 1, 0, 0, 0, 0);
        previousEndDate = new Date(monthBeforeLast.getFullYear(), monthBeforeLast.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      }

      case "year": {
        currentStartDate = new Date(today.getFullYear(), 0, 1);
        currentEndDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

        previousStartDate = new Date(today.getFullYear() - 1, 0, 1);
        previousEndDate = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
      }

      case "yeartodate": {
        currentStartDate = new Date(today.getFullYear(), 0, 1);
        currentEndDate = setEndOfDay(today);

        previousStartDate = new Date(today.getFullYear() - 1, 0, 1);
        previousEndDate = new Date(today.getFullYear() - 1, currentEndDate.getMonth(), currentEndDate.getDate(), 23, 59, 59, 999);
        break;
      }

      // case "custom": {
      //   if (fromDate && toDate) {
      //     const [fromYear, fromMonth] = fromDate.split("-").map(Number);
      //     const [toYear, toMonth] = toDate.split("-").map(Number);
      //     currentStartDate = new Date(fromYear, fromMonth - 1, 1);
      //     currentEndDate = new Date(toYear, toMonth, 0, 23, 59, 59, 999);

      //     const duration = (currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24) + 1;
      //     previousEndDate = new Date(currentStartDate.getTime() - 1);
      //     previousStartDate = new Date(previousEndDate.getTime() - (duration - 1) * 86400000);
      //   } else {
      //     return res.status(400).json({ error: "Custom range requires both fromDate and toDate in YYYY-MM format" });
      //   }
      //   break;
      // }

      case "custom": {
  if (fromDate && toDate) {
    const [fromYear, fromMonth] = fromDate.split("-").map(Number);
    const [toYear, toMonth] = toDate.split("-").map(Number);

    // Current range
    currentStartDate = new Date(fromYear, fromMonth - 1, 1);
    currentEndDate = new Date(toYear, toMonth, 0, 23, 59, 59, 999);

    // Previous range (exact same duration as current, from previous months)
    const monthsDiff = (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;

    const prevTo = new Date(fromYear, fromMonth - 1, 0); // end of previous month
    previousEndDate = new Date(prevTo.getFullYear(), prevTo.getMonth(), prevTo.getDate(), 23, 59, 59, 999);

    const prevFromMonth = prevTo.getMonth() - (monthsDiff - 1);
    const prevFromYear = prevTo.getFullYear() + Math.floor(prevFromMonth / 12);
    const adjustedPrevFromMonth = (prevFromMonth + 12) % 12;

    previousStartDate = new Date(prevFromYear, adjustedPrevFromMonth, 1);
  } else {
    return res.status(400).json({ error: "Custom range requires both fromDate and toDate in YYYY-MM format" });
  }
  break;
}


      case "last30days": {
        currentEndDate = setEndOfDay(today);
        currentStartDate = new Date(today.getTime() - (29 * 86400000));

        previousEndDate = new Date(currentStartDate.getTime() - 1);
        previousStartDate = new Date(previousEndDate.getTime() - (29 * 86400000));
        break;
      }

      case "6months":
      default: {
        currentStartDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        currentEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        const duration = (currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24) + 1;
        previousEndDate = new Date(currentStartDate.getTime() - 1);
        previousStartDate = new Date(previousEndDate.getTime() - (duration - 1) * 86400000);
        break;
      }
    }

    if (sku) query.SKU = { $in: sku.split(",").map(s => s.trim()) };
    if (state) query.state = state;
    if (city) query.city = city;

    const currentRecords = await SalesRecord.find({
      ...query,
      purchaseDate: { $gte: currentStartDate, $lte: currentEndDate }
    });

    let breakdown = {}, totalQuantity = 0, totalSales = 0;
    let orderIdsSet = new Set();
    let totalOrderCount = 0;

    currentRecords.forEach(record => {
      const date = new Date(record.purchaseDate);
      const key = date.toISOString().split('T')[0];

      const quantity = Number(record.quantity) || 0;
      const sales = Number(record.totalSales) || 0;
      const orderId = (record.orderID || record.orderId || '').trim();

      if (orderId) orderIdsSet.add(orderId);

      totalQuantity += quantity;
      totalSales += sales;

      if (!breakdown[key]) {
        breakdown[key] = {
          date: key,
          totalQuantity: 0,
          totalSales: 0,
          orderIDs: [] // not using Set anymore
        };
      }

      breakdown[key].totalQuantity += quantity;
      breakdown[key].totalSales += sales;
      if (orderId) {
        breakdown[key].orderIDs.push(orderId);
        totalOrderCount++;
      }
    });

    const previousRecords = await SalesRecord.find({
      ...query,
      purchaseDate: { $gte: previousStartDate, $lte: previousEndDate }
    });

    let prevTotalQuantity = 0, prevTotalSales = 0;
    let prevOrderIdsSet = new Set();
    let prevTotalOrderCount = 0;

    previousRecords.forEach(record => {
      const quantity = Number(record.quantity) || 0;
      const sales = Number(record.totalSales) || 0;
      const orderId = (record.orderID || record.orderId || '').trim();

      if (orderId) prevOrderIdsSet.add(orderId);

      prevTotalQuantity += quantity;
      prevTotalSales += sales;
      if (orderId) prevTotalOrderCount++;
    });

    const quantityDiff = totalQuantity - prevTotalQuantity;
    const salesDiff = totalSales - prevTotalSales;

    const result = {
      totalQuantity,
      totalSales,
      totalOrders: totalOrderCount, // ✅ total orders including duplicates
      
breakdown: Object.entries(breakdown)
  .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB)) // sort in ascending order
  .map(([key, value]) => ({
    date: value.date,
    totalQuantity: value.totalQuantity,
    totalSales: value.totalSales,
    orderCount: value.orderIDs.length
  })),


      // breakdown: Object.entries(breakdown).map(([key, value]) => ({
      //   date: value.date,
      //   totalQuantity: value.totalQuantity,
      //   totalSales: value.totalSales,
      //   orderCount: value.orderIDs.length // ✅ not unique
      // })),
      comparison: {
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
        previousTotalOrders: prevTotalOrderCount,
        quantityChangePercent: `${Math.abs(
          prevTotalQuantity ? ((quantityDiff / prevTotalQuantity) * 100).toFixed(2) : 100
        )}% ${quantityDiff >= 0 ? 'Profit' : 'Loss'}`,
        salesChangePercent: `${Math.abs(
          prevTotalSales ? ((salesDiff / prevTotalSales) * 100).toFixed(2) : 100
        )}% ${salesDiff >= 0 ? 'Profit' : 'Loss'}`,
        ordersChangePercent: `${Math.abs(
          prevTotalOrderCount ? (((totalOrderCount - prevTotalOrderCount) / prevTotalOrderCount) * 100).toFixed(2) : 100
        )}% ${totalOrderCount >= prevTotalOrderCount ? 'Profit' : 'Loss'}`,
      }
    };

    res.json(result);
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: error.message });
  }
};



// exports.getresionsale = async (req, res) => {
//   //ths working
//   try {
//     const { sku, filterType = "6months", fromDate, toDate, state, city } = req.query;

//     const today = new Date();
//     const query = {};

//     const setStartOfDay = date => new Date(date.setHours(0, 0, 0, 0));
//     const setEndOfDay = date => new Date(date.setHours(23, 59, 59, 999));

//     let currentStartDate, currentEndDate;
//     let previousStartDate, previousEndDate;

//     switch (filterType) {
//       case "today": {
//         currentStartDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
//         currentEndDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

//         const yesterday = new Date(today);
//         yesterday.setDate(today.getDate() - 1);
//         previousStartDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
//         previousEndDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
//         break;
//       }

//       case "week": {
//         currentStartDate = new Date(today);
//         currentStartDate.setDate(today.getDate() - today.getDay()); // start of week
//         currentStartDate = setStartOfDay(currentStartDate);
//         currentEndDate = setEndOfDay(today);

//         previousStartDate = new Date(currentStartDate);
//         previousStartDate.setDate(currentStartDate.getDate() - 7);
//         previousEndDate = new Date(currentEndDate);
//         previousEndDate.setDate(currentEndDate.getDate() - 7);
//         break;
//       }

//       case "monthtodate": {
//         currentStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
//         currentEndDate = setEndOfDay(today);

//         const previousMonth = today.getMonth() - 1;
//         const previousYear = previousMonth < 0 ? today.getFullYear() - 1 : today.getFullYear();
//         const adjustedPrevMonth = (previousMonth + 12) % 12;

//         previousStartDate = new Date(previousYear, adjustedPrevMonth, 1, 0, 0, 0, 0);
//         previousEndDate = new Date(previousYear, adjustedPrevMonth + 1, 0, 23, 59, 59, 999);
//         break;
//       }

//       case "lastmonth": {
//         const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
//         currentStartDate = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1, 0, 0, 0, 0);
//         currentEndDate = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0, 23, 59, 59, 999);

//         const monthBeforeLast = new Date(today.getFullYear(), today.getMonth() - 2, 1);
//         previousStartDate = new Date(monthBeforeLast.getFullYear(), monthBeforeLast.getMonth(), 1, 0, 0, 0, 0);
//         previousEndDate = new Date(monthBeforeLast.getFullYear(), monthBeforeLast.getMonth() + 1, 0, 23, 59, 59, 999);
//         break;
//       }

//       case "year": {
//         currentStartDate = new Date(today.getFullYear(), 0, 1);
//         currentEndDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

//         previousStartDate = new Date(today.getFullYear() - 1, 0, 1);
//         previousEndDate = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
//         break;
//       }

//       case "yeartodate": {
//         currentStartDate = new Date(today.getFullYear(), 0, 1);
//         currentEndDate = setEndOfDay(today);

//         previousStartDate = new Date(today.getFullYear() - 1, 0, 1);
//         previousEndDate = new Date(today.getFullYear() - 1, currentEndDate.getMonth(), currentEndDate.getDate(), 23, 59, 59, 999);
//         break;
//       }

//       case "custom": {
//         if (fromDate && toDate) {
//           const [fromYear, fromMonth] = fromDate.split("-").map(Number);
//           const [toYear, toMonth] = toDate.split("-").map(Number);
//           currentStartDate = new Date(fromYear, fromMonth - 1, 1);
//           currentEndDate = new Date(toYear, toMonth, 0, 23, 59, 59, 999);

//           // previous duration: same number of days
//           const duration = (currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24) + 1;
//           previousEndDate = new Date(currentStartDate.getTime() - 1);
//           previousStartDate = new Date(previousEndDate.getTime() - (duration - 1) * 86400000);
//         } else {
//           return res.status(400).json({ error: "Custom range requires both fromDate and toDate in YYYY-MM format" });
//         }
//         break;
//       }

//       case "last30days": {
//         currentEndDate = setEndOfDay(today);
//         currentStartDate = new Date(today.getTime() - (29 * 86400000));

//         previousEndDate = new Date(currentStartDate.getTime() - 1);
//         previousStartDate = new Date(previousEndDate.getTime() - (29 * 86400000));
//         break;
//       }

//       case "6months":
//       default: {
//         currentStartDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
//         currentEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

//         const duration = (currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24) + 1;
//         previousEndDate = new Date(currentStartDate.getTime() - 1);
//         previousStartDate = new Date(previousEndDate.getTime() - (duration - 1) * 86400000);
//         break;
//       }
//     }

//     if (sku) query.SKU = { $in: sku.split(",").map(s => s.trim()) };
//     if (state) query.state = state;
//     if (city) query.city = city;

//     const currentRecords = await SalesRecord.find({
//       ...query,
//       purchaseDate: { $gte: currentStartDate, $lte: currentEndDate }
//     });

//     let breakdown = {}, totalQuantity = 0, totalSales = 0;
//     let orderIdsSet = new Set();

//     currentRecords.forEach(record => {
//       const date = new Date(record.purchaseDate);
//       const key = date.toISOString().split('T')[0];

//       const quantity = Number(record.quantity) || 0;
//       const sales = Number(record.totalSales) || 0;
//       const orderId = (record.orderID || record.orderId || '').trim();

//       if (orderId) orderIdsSet.add(orderId);

//       totalQuantity += quantity;
//       totalSales += sales;

//       if (!breakdown[key]) {
//         breakdown[key] = {
//           date: key,
//           totalQuantity: 0,
//           totalSales: 0,
//           orderIDs: new Set()
//         };
//       }

//       breakdown[key].totalQuantity += quantity;
//       breakdown[key].totalSales += sales;
//       if (orderId) breakdown[key].orderIDs.add(orderId);
//     });

//     const previousRecords = await SalesRecord.find({
//       ...query,
//       purchaseDate: { $gte: previousStartDate, $lte: previousEndDate }
//     });

//     let prevTotalQuantity = 0, prevTotalSales = 0;
//     let prevOrderIdsSet = new Set();

//     previousRecords.forEach(record => {
//       const quantity = Number(record.quantity) || 0;
//       const sales = Number(record.totalSales) || 0;
//       const orderId = (record.orderID || record.orderId || '').trim();

//       if (orderId) prevOrderIdsSet.add(orderId);

//       prevTotalQuantity += quantity;
//       prevTotalSales += sales;
//     });

//     const quantityDiff = totalQuantity - prevTotalQuantity;
//     const salesDiff = totalSales - prevTotalSales;

//     const result = {
//       totalQuantity,
//       totalSales,
//       totalUniqueOrders: orderIdsSet.size,
//       breakdown: Object.entries(breakdown).map(([key, value]) => ({
//         date: value.date,
//         totalQuantity: value.totalQuantity,
//         totalSales: value.totalSales,
//         orderCount: value.orderIDs.size
//       })),
//       comparison: {
//         currentPeriod: {
//           startDate: currentStartDate.toISOString().split('T')[0],
//           endDate: currentEndDate.toISOString().split('T')[0],
//         },
//         previousPeriod: {
//           startDate: previousStartDate.toISOString().split('T')[0],
//           endDate: previousEndDate.toISOString().split('T')[0],
//         },
//         previousTotalQuantity: prevTotalQuantity,
//         previousTotalSales: prevTotalSales,
//         previousTotalUniqueOrders: prevOrderIdsSet.size,
//         quantityChangePercent: `${Math.abs(
//           prevTotalQuantity ? ((quantityDiff / prevTotalQuantity) * 100).toFixed(2) : 100
//         )}% ${quantityDiff >= 0 ? 'Profit' : 'Loss'}`,
//         salesChangePercent: `${Math.abs(
//           prevTotalSales ? ((salesDiff / prevTotalSales) * 100).toFixed(2) : 100
//         )}% ${salesDiff >= 0 ? 'Profit' : 'Loss'}`,
//         uniqueOrdersChangePercent: `${Math.abs(
//           prevOrderIdsSet.size ? (((orderIdsSet.size - prevOrderIdsSet.size) / prevOrderIdsSet.size) * 100).toFixed(2) : 100
//         )}% ${orderIdsSet.size >= prevOrderIdsSet.size ? 'Profit' : 'Loss'}`,
//       }
//     };

//     res.json(result);
//   } catch (error) {
//     console.error("API error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };




