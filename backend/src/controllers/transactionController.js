const { Sale, PurchaseOrder, Return, Product, StockMovement, Shop } = require('../models');

// Helper to pad invoice numbers
const padZero = (num, size) => {
  let s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
};

// --- SALES SECTION ---

// Get Sales Records
const getSales = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { startDate, endDate, paymentMethod, status } = req.query;

    const query = { shop: shopId };

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }
    if (status) {
      query.status = status;
    }

    let sales = await Sale.find(query);

    // Filter by date range if provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      // Set end date to end of day
      end.setHours(23, 59, 59, 999);

      sales = sales.filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= start && saleDate <= end;
      });
    }

    // Sort by newest sales
    sales.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({ success: true, sales });
  } catch (error) {
    console.error('Get sales error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching sales history' });
  }
};

// Record a Sale (Point of Sale)
const createSale = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { customerName, customerPhone, items, discount = 0, paymentMethod, notes } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Please add at least one item to checkout' });
    }

    // Fetch shop details to get invoice prefix and tax rate
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop configuration not found' });
    }

    // Validate stock levels first and prepare sale items
    const saleItems = [];
    let subtotal = 0;

    for (let item of items) {
      const product = await Product.findOne({ _id: item.product, shop: shopId, isDeleted: { $ne: true } });
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found or unavailable.` });
      }

      if (product.stockQty < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}'. Requested: ${item.qty}, Available: ${product.stockQty}`
        });
      }

      const itemDiscount = Number(item.discount || 0);
      const itemTotal = (product.sellingPrice * item.qty) - itemDiscount;
      subtotal += product.sellingPrice * item.qty;

      saleItems.push({
        product: product._id,
        productName: product.name,
        qty: item.qty,
        unitPrice: product.sellingPrice,
        discount: itemDiscount,
        total: itemTotal,
        buyingPrice: product.buyingPrice // Keep record of cost of goods sold (COGS) for profit calculations
      });
    }

    // Calculate Tax & Final Totals
    const taxRate = shop.taxRate || 0;
    const finalDiscount = Number(discount);
    const taxableAmount = Math.max(0, subtotal - finalDiscount);
    const tax = Math.round((taxableAmount * (taxRate / 100)) * 100) / 100;
    const netTotal = taxableAmount + tax;

    // Generate Sequential Invoice Number
    const salesCount = await Sale.countDocuments({ shop: shopId });
    const invoicePrefix = shop.invoicePrefix || 'SL';
    const invoiceNumber = `INV-${invoicePrefix}-${padZero(salesCount + 1, 5)}`;

    // Create Sale record
    const newSale = await Sale.create({
      invoiceNumber,
      customer: {
        name: customerName || 'Walking Customer',
        phone: customerPhone || ''
      },
      items: saleItems,
      subtotal,
      discount: finalDiscount,
      tax,
      netTotal,
      paymentMethod: paymentMethod || 'Cash',
      status: 'Completed',
      notes: notes || '',
      createdBy: req.user._id,
      shop: shopId
    });

    // Update product stock levels and record stock movements
    for (let item of saleItems) {
      const product = await Product.findById(item.product);
      const beforeStock = product.stockQty;
      const afterStock = beforeStock - item.qty;

      // Update product stock
      await Product.findByIdAndUpdate(product._id, { stockQty: afterStock });

      // Create Stock Movement record
      await StockMovement.create({
        product: product._id,
        type: 'sale',
        quantityChange: -item.qty,
        stockBefore: beforeStock,
        stockAfter: afterStock,
        referenceType: 'Sale',
        referenceId: newSale._id,
        notes: `Recorded in invoice ${invoiceNumber}`,
        createdBy: req.user._id,
        shop: shopId
      });

      // Simple email notification log check (Low Stock Alarm)
      if (afterStock <= product.reorderPoint) {
        console.log(`[ALERT] [LOW STOCK] Product '${product.name}' is below reorder point! Current Stock: ${afterStock}, Threshold: ${product.reorderPoint}. Email warning simulated to ${shop.alertEmail || 'owner'}.`);
      }
    }

    return res.status(201).json({ success: true, sale: newSale });
  } catch (error) {
    console.error('Create sale error:', error);
    return res.status(500).json({ success: false, message: 'Server error recording transaction' });
  }
};

// Get Single Sale Detail
const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, shop: req.user.shopId });
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Transaction record not found' });
    }
    return res.status(200).json({ success: true, sale });
  } catch (error) {
    console.error('Get sale by ID error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving transaction' });
  }
};

// --- PURCHASE ORDERS SECTION ---

// Get Purchase Orders
const getPurchases = async (req, res) => {
  try {
    const purchases = await PurchaseOrder.find({ shop: req.user.shopId });
    // Sort newest first
    purchases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json({ success: true, purchases });
  } catch (error) {
    console.error('Get purchases error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching purchase orders' });
  }
};

// Create Purchase Order
const createPurchaseOrder = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { supplierId, items, expectedDelivery, paymentTerms, status = 'Draft', notes } = req.body;

    if (!supplierId || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Please provide supplier and products to order' });
    }

    let totalValue = 0;
    const poItems = [];

    for (let item of items) {
      const product = await Product.findOne({ _id: item.product, shop: shopId, isDeleted: { $ne: true } });
      if (!product) {
        return res.status(400).json({ success: false, message: 'Selected product is unavailable' });
      }

      const unitCost = Number(item.unitCost || product.buyingPrice);
      const total = unitCost * item.qty;
      totalValue += total;

      poItems.push({
        product: product._id,
        productName: product.name,
        qty: item.qty,
        unitCost,
        total
      });
    }

    // Auto-generate PO number
    const poCount = await PurchaseOrder.countDocuments({ shop: shopId });
    const poNumber = `PO-${Date.now().toString().slice(-4)}-${padZero(poCount + 1, 4)}`;

    const newPO = await PurchaseOrder.create({
      poNumber,
      supplier: supplierId,
      items: poItems,
      totalValue,
      expectedDelivery: expectedDelivery || '',
      paymentTerms: paymentTerms || 'Net 30',
      status: status || 'Draft',
      notes: notes || '',
      createdBy: req.user._id,
      shop: shopId
    });

    return res.status(201).json({ success: true, purchaseOrder: newPO });
  } catch (error) {
    console.error('Create PO error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating purchase order' });
  }
};

// Receive Purchase Order (Updates Stock)
const receivePurchaseOrder = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const po = await PurchaseOrder.findOne({ _id: req.params.id, shop: shopId });

    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    }

    if (po.status === 'Received') {
      return res.status(400).json({ success: false, message: 'Purchase Order has already been fully received.' });
    }

    // Update product stocks
    for (let item of po.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const beforeStock = product.stockQty;
        const afterStock = beforeStock + item.qty;

        // Increment stock
        await Product.findByIdAndUpdate(product._id, { stockQty: afterStock });

        // Record stock movement
        await StockMovement.create({
          product: product._id,
          type: 'purchase',
          quantityChange: item.qty,
          stockBefore: beforeStock,
          stockAfter: afterStock,
          referenceType: 'PurchaseOrder',
          referenceId: po._id,
          notes: `Received cargo under PO ${po.poNumber}`,
          createdBy: req.user._id,
          shop: shopId
        });
      }
    }

    // Mark PO as fully received
    const updated = await PurchaseOrder.findByIdAndUpdate(po._id, { status: 'Received' }, { new: true });

    return res.status(200).json({ success: true, purchaseOrder: updated });
  } catch (error) {
    console.error('Receive PO error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing purchase cargo receipt' });
  }
};

// Delete Purchase Order (Draft only)
const deletePurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, shop: req.user.shopId });
    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    }

    if (po.status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'Only Draft Purchase Orders can be deleted' });
    }

    await PurchaseOrder.findByIdAndDelete(po._id);
    return res.status(200).json({ success: true, message: 'Purchase Order deleted successfully' });
  } catch (error) {
    console.error('Delete PO error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting purchase order' });
  }
};

// --- RETURNS SECTION ---

// Get Returns
const getReturns = async (req, res) => {
  try {
    const returns = await Return.find({ shop: req.user.shopId });
    returns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json({ success: true, returns });
  } catch (error) {
    console.error('Get returns error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching return documents' });
  }
};

// Create Return
const createReturn = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { type, referenceId, items, notes } = req.body;

    if (!type || !referenceId || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Please provide return type, reference transaction, and items' });
    }

    // Generate Return Number
    const returnCount = await Return.countDocuments({ shop: shopId });
    const returnNumber = `RET-${type === 'sale_return' ? 'SL' : 'PO'}-${padZero(returnCount + 1, 4)}`;

    const newReturn = await Return.create({
      returnNumber,
      type,
      referenceId,
      referenceModel: type === 'sale_return' ? 'Sale' : 'PurchaseOrder',
      items,
      status: 'Pending', // Pending, Approved, Rejected
      notes: notes || '',
      processedBy: req.user._id,
      shop: shopId
    });

    return res.status(201).json({ success: true, returnRecord: newReturn });
  } catch (error) {
    console.error('Create return error:', error);
    return res.status(500).json({ success: false, message: 'Server error lodging return request' });
  }
};

// Update Return Status (Approve/Reject)
const updateReturnStatus = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { status } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update. Choose Approved or Rejected.' });
    }

    const ret = await Return.findOne({ _id: req.params.id, shop: shopId });
    if (!ret) {
      return res.status(404).json({ success: false, message: 'Return record not found' });
    }

    if (ret.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Return request has already been processed' });
    }

    // If approved, adjust stock levels
    if (status === 'Approved') {
      for (let item of ret.items) {
        const product = await Product.findById(item.product);
        if (product) {
          const beforeStock = product.stockQty;
          let afterStock = beforeStock;

          if (ret.type === 'sale_return') {
            // Customer returned product to shop → increment stock
            afterStock = beforeStock + item.qty;
          } else {
            // Shop returned product to supplier → decrement stock
            afterStock = Math.max(0, beforeStock - item.qty);
          }

          // Update product stock
          await Product.findByIdAndUpdate(product._id, { stockQty: afterStock });

          // Record stock movement
          await StockMovement.create({
            product: product._id,
            type: 'return',
            quantityChange: ret.type === 'sale_return' ? item.qty : -item.qty,
            stockBefore: beforeStock,
            stockAfter: afterStock,
            referenceType: 'Return',
            referenceId: ret._id,
            notes: `Approved return ${ret.returnNumber}. Reason: ${item.reason || 'None'}`,
            createdBy: req.user._id,
            shop: shopId
          });
        }
      }
    }

    const updated = await Return.findByIdAndUpdate(ret._id, { status }, { new: true });
    return res.status(200).json({ success: true, returnRecord: updated });
  } catch (error) {
    console.error('Process return error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing return status' });
  }
};

module.exports = {
  getSales,
  createSale,
  getSaleById,
  getPurchases,
  createPurchaseOrder,
  receivePurchaseOrder,
  deletePurchaseOrder,
  getReturns,
  createReturn,
  updateReturnStatus
};
