const { Sale, PurchaseOrder, Product, StockMovement, Category, Supplier } = require('../models');

// --- DASHBOARD DATA & STATS ---

// All KPIs + Sparkline Data in one call
const getDashboardStats = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Total Revenue (Today & This Month)
    const sales = await Sale.find({ shop: shopId, status: 'Completed' });
    
    const revenueToday = sales
      .filter(s => new Date(s.createdAt) >= startOfDay)
      .reduce((acc, s) => acc + s.netTotal, 0);

    const revenueThisMonth = sales
      .filter(s => {
        const d = new Date(s.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, s) => acc + s.netTotal, 0);

    // 2. Total Products
    const totalProducts = await Product.countDocuments({ shop: shopId, isDeleted: { $ne: true } });

    // 3. Low Stock Items count
    const products = await Product.find({ shop: shopId, isDeleted: { $ne: true } });
    const lowStockItems = products.filter(p => p.stockQty <= p.reorderPoint).length;

    // 4. Pending Purchase Orders count
    const pendingPOs = await PurchaseOrder.countDocuments({
      shop: shopId,
      status: { $in: ['Draft', 'Sent', 'Partial'] }
    });

    // Create simple sparkline history data for revenue
    // Group sales of past 7 days into daily buckets
    const sparklineData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const dayRevenue = sales
        .filter(s => {
          const sc = new Date(s.createdAt);
          return sc >= dayStart && sc <= dayEnd;
        })
        .reduce((acc, s) => acc + s.netTotal, 0);

      sparklineData.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        value: dayRevenue
      });
    }

    return res.status(200).json({
      success: true,
      stats: {
        revenueToday,
        revenueThisMonth,
        totalProducts,
        lowStockItems,
        pendingPOs
      },
      sparklineData
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving dashboard statistics' });
  }
};

// Charts Data (Line chart revenue vs cost, Donut stock, Bar top items)
const getDashboardCharts = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const now = new Date();

    // 1. Line Chart: Revenue vs Cost (last 30 days)
    const sales = await Sale.find({ shop: shopId, status: 'Completed' });
    const purchases = await PurchaseOrder.find({ shop: shopId, status: 'Received' });

    const timeline = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      // Revenue for this day
      const rev = sales
        .filter(s => {
          const sc = new Date(s.createdAt);
          return sc >= start && sc <= end;
        })
        .reduce((acc, s) => acc + s.netTotal, 0);

      // Cost for this day (purchased stock received)
      const cost = purchases
        .filter(p => {
          const pc = new Date(p.createdAt);
          return pc >= start && pc <= end;
        })
        .reduce((acc, p) => acc + p.totalValue, 0);

      timeline.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Revenue: Math.round(rev * 100) / 100,
        Expenses: Math.round(cost * 100) / 100
      });
    }

    // 2. Stock Distribution Donut
    const products = await Product.find({ shop: shopId, isDeleted: { $ne: true } });
    
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach(p => {
      if (p.stockQty <= 0) outOfStock++;
      else if (p.stockQty <= p.reorderPoint) lowStock++;
      else inStock++;
    });

    const stockDistribution = [
      { name: 'In Stock', value: inStock, color: '#2E7D32' },
      { name: 'Low Stock', value: lowStock, color: '#B45309' },
      { name: 'Out of Stock', value: outOfStock, color: '#C0392B' }
    ];

    // 3. Top-selling Products (by qty sold)
    const productSalesMap = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const prodId = String(item.product);
        if (!productSalesMap[prodId]) {
          productSalesMap[prodId] = {
            name: item.productName,
            unitsSold: 0
          };
        }
        productSalesMap[prodId].unitsSold += item.qty;
      });
    });

    const topSelling = Object.values(productSalesMap)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      revenueExpensesLine: timeline,
      stockDistribution,
      topProductsBar: topSelling
    });
  } catch (error) {
    console.error('Get dashboard charts error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving chart data' });
  }
};

// --- REPORTS TABS SECTION ---

// Detailed Sales Report (with filters)
const getSalesReport = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { startDate, endDate, category, paymentMethod } = req.query;

    const query = { shop: shopId };
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    let sales = await Sale.find(query);

    // Apply date filter
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);

      sales = sales.filter(s => {
        const sc = new Date(s.createdAt);
        return sc >= start && sc <= end;
      });
    }

    // Apply category filter if requested (filter sales where at least one item belongs to category)
    if (category) {
      // Fetch product IDs of category
      const targetProds = await Product.find({ category, shop: shopId });
      const targetProdIds = targetProds.map(p => String(p._id));

      sales = sales.filter(s => 
        s.items.some(item => targetProdIds.includes(String(item.product)))
      );
    }

    sales.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Totals calculations
    const totals = {
      subtotal: sales.reduce((acc, s) => acc + s.subtotal, 0),
      discount: sales.reduce((acc, s) => acc + s.discount, 0),
      tax: sales.reduce((acc, s) => acc + s.tax, 0),
      netTotal: sales.reduce((acc, s) => acc + s.netTotal, 0)
    };

    return res.status(200).json({ success: true, sales, totals });
  } catch (error) {
    console.error('Get sales report error:', error);
    return res.status(500).json({ success: false, message: 'Server error compiling sales report' });
  }
};

// Detailed Purchase Report
const getPurchaseReport = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { startDate, endDate, supplier } = req.query;

    const query = { shop: shopId };
    if (supplier) {
      query.supplier = supplier;
    }

    let purchases = await PurchaseOrder.find(query);

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);

      purchases = purchases.filter(p => {
        const pc = new Date(p.createdAt);
        return pc >= start && pc <= end;
      });
    }

    purchases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const totalPurchasesValue = purchases.reduce((acc, p) => acc + p.totalValue, 0);

    return res.status(200).json({ success: true, purchases, totalValue: totalPurchasesValue });
  } catch (error) {
    console.error('Get purchase report error:', error);
    return res.status(500).json({ success: false, message: 'Server error compiling purchase order report' });
  }
};

// Inventory Stock Valuation & Movement History
const getInventoryReport = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { productId } = req.query;

    // Fetch active products to calculate stock valuation
    const products = await Product.find({ shop: shopId, isDeleted: { $ne: true } });
    
    let totalValuation = 0;
    const valuationTable = products.map(p => {
      const totalValue = p.stockQty * p.buyingPrice;
      totalValuation += totalValue;
      return {
        _id: p._id,
        name: p.name,
        sku: p.sku,
        stockQty: p.stockQty,
        buyingPrice: p.buyingPrice,
        totalValue
      };
    });

    // Stock movement logs
    const movementQuery = { shop: shopId };
    if (productId) {
      movementQuery.product = productId;
    }

    const movements = await StockMovement.find(movementQuery);
    
    // Sort movements by date descending
    movements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Resolve product names on movements manually for mock/speed
    const movementsEnriched = movements.map(m => {
      const prod = products.find(p => String(p._id) === String(m.product));
      return {
        ...m,
        productName: prod ? prod.name : 'Unknown Product',
        productSku: prod ? prod.sku : ''
      };
    });

    return res.status(200).json({
      success: true,
      totalValuation,
      valuationTable,
      stockMovements: movementsEnriched
    });
  } catch (error) {
    console.error('Get inventory report error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating inventory report' });
  }
};

// Profit & Loss Accounting Sheet
const getProfitLossReport = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { startDate, endDate } = req.query;

    const salesQuery = { shop: shopId, status: 'Completed' };
    const purchasesQuery = { shop: shopId, status: 'Received' };

    let sales = await Sale.find(salesQuery);
    let purchases = await PurchaseOrder.find(purchasesQuery);

    // Apply date filters
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);

      sales = sales.filter(s => new Date(s.createdAt) >= start && new Date(s.createdAt) <= end);
      purchases = purchases.filter(p => new Date(p.createdAt) >= start && new Date(p.createdAt) <= end);
    }

    // Compute Income: Sum of Sales Subtotals (excluding tax to reflect pure business revenue)
    const revenue = sales.reduce((acc, s) => acc + s.subtotal - s.discount, 0);

    // Compute COGS (Cost of Goods Sold)
    // For every sale item, we check product's buyingPrice * quantity sold
    let cogs = 0;
    for (let sale of sales) {
      for (let item of sale.items) {
        // Resolve product buying cost at transaction time or fallback
        const costPrice = item.buyingPrice || 0;
        cogs += costPrice * item.qty;
      }
    }

    const grossProfit = revenue - cogs;
    const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Expenses: Sum of completed purchase order values that are received during the period
    const purchaseExpenses = purchases.reduce((acc, p) => acc + p.totalValue, 0);

    // Dynamic categorizations
    const categoryRevenue = {};
    for (let sale of sales) {
      for (let item of sale.items) {
        const prod = await Product.findById(item.product);
        let catName = 'Unassigned';
        if (prod && prod.category) {
          const cat = await Category.findById(prod.category);
          if (cat) catName = cat.name;
        }
        categoryRevenue[catName] = (categoryRevenue[catName] || 0) + (item.total);
      }
    }

    const revenueByCategory = Object.entries(categoryRevenue).map(([name, value]) => ({ name, value }));

    return res.status(200).json({
      success: true,
      revenue,
      cogs,
      grossProfit,
      profitMargin,
      purchaseExpenses,
      revenueByCategory,
      netProfit: grossProfit - purchaseExpenses // Gross Profit minus operational purchases
    });
  } catch (error) {
    console.error('Get P&L error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating accounting sheet' });
  }
};

module.exports = {
  getDashboardStats,
  getDashboardCharts,
  getSalesReport,
  getPurchaseReport,
  getInventoryReport,
  getProfitLossReport
};
