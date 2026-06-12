const { Product, Category, StockMovement } = require('../models');

// Helper to generate SKU
const generateSKU = (name, categoryName) => {
  const namePart = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PR');
  const catPart = categoryName ? categoryName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'CAT') : 'GEN';
  const randPart = Math.floor(1000 + Math.random() * 9000);
  return `${namePart}-${catPart}-${randPart}`;
};

// --- PRODUCTS CRUD ---

// Get Products (with Search, Filter, Sort, Paginate)
const getProducts = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { search, category, stockStatus, sort, page = 1, limit = 10 } = req.query;

    const query = { shop: shopId, isDeleted: { $ne: true } };

    // Search filter
    if (search) {
      // Regex query support
      query.$or = [
        { name: new RegExp(search, 'i') },
        { sku: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Stock status filter
    if (stockStatus) {
      if (stockStatus === 'In Stock') {
        query.stockQty = { $gt: 0 }; // technically above reorderPoint, but user defined:
        // Let's implement dynamic logic:
        // "In Stock" -> stockQty > reorderPoint
        // "Low Stock" -> stockQty > 0 && stockQty <= reorderPoint
        // "Out of Stock" -> stockQty = 0
      }
    }

    // Load all matching products
    let products = await Product.find(query);

    // Filter by stock status manually if required by mock or simple query
    if (stockStatus) {
      products = products.filter(p => {
        const isOut = p.stockQty <= 0;
        const isLow = p.stockQty > 0 && p.stockQty <= p.reorderPoint;
        const isIn = p.stockQty > p.reorderPoint;
        if (stockStatus === 'In Stock') return isIn;
        if (stockStatus === 'Low Stock') return isLow;
        if (stockStatus === 'Out of Stock') return isOut;
        return true;
      });
    }

    // Sorting
    if (sort) {
      if (sort === 'Name A-Z') {
        products.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sort === 'Price Low-High') {
        products.sort((a, b) => a.sellingPrice - b.sellingPrice);
      } else if (sort === 'Stock Low-High') {
        products.sort((a, b) => a.stockQty - b.stockQty);
      } else if (sort === 'Recently Added') {
        products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    } else {
      // default sort by recently added
      products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Server-side Pagination
    const total = products.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedProducts = products.slice(startIndex, startIndex + limitNum);

    return res.status(200).json({
      success: true,
      products: paginatedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving products' });
  }
};

// Create Product
const createProduct = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { name, sku, description, category, supplier, buyingPrice, sellingPrice, stockQty, reorderPoint, unit, tags, image } = req.body;

    if (!name || !category || !supplier || buyingPrice === undefined || sellingPrice === undefined || stockQty === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all required product details' });
    }

    // Find category to generate SKU if empty
    let finalSku = sku;
    if (!finalSku) {
      const cat = await Category.findById(category);
      finalSku = generateSKU(name, cat ? cat.name : '');
    }

    // Check if SKU exists
    const skuExists = await Product.findOne({ sku: finalSku, shop: shopId, isDeleted: { $ne: true } });
    if (skuExists) {
      return res.status(400).json({
        success: false,
        message: `Could not save product — SKU '${finalSku}' already exists. Try a different SKU.`
      });
    }

    const newProduct = await Product.create({
      name,
      sku: finalSku,
      description,
      category,
      supplier,
      buyingPrice: Number(buyingPrice),
      sellingPrice: Number(sellingPrice),
      stockQty: Number(stockQty),
      reorderPoint: Number(reorderPoint || 5),
      unit: unit || 'pcs',
      image: image || '',
      tags: Array.isArray(tags) ? tags : [],
      shop: shopId,
      createdBy: req.user._id,
      isActive: true,
      isDeleted: false
    });

    // Record Stock Movement if stockQty > 0
    if (Number(stockQty) > 0) {
      await StockMovement.create({
        product: newProduct._id,
        type: 'manual_adjustment',
        quantityChange: Number(stockQty),
        stockBefore: 0,
        stockAfter: Number(stockQty),
        notes: 'Initial inventory load',
        createdBy: req.user._id,
        shop: shopId
      });
    }

    return res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating product' });
  }
};

// Get Product By ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, shop: req.user.shopId, isDeleted: { $ne: true } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Get product by ID error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving product details' });
  }
};

// Update Product
const updateProduct = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { name, sku, description, category, supplier, buyingPrice, sellingPrice, reorderPoint, unit, tags, image, isActive } = req.body;

    const product = await Product.findOne({ _id: req.params.id, shop: shopId, isDeleted: { $ne: true } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // SKU uniqueness check if SKU changed
    if (sku && sku !== product.sku) {
      const skuExists = await Product.findOne({ sku, shop: shopId, isDeleted: { $ne: true } });
      if (skuExists) {
        return res.status(400).json({
          success: false,
          message: `Could not save product — SKU '${sku}' already exists. Try a different SKU.`
        });
      }
    }

    const updated = await Product.findByIdAndUpdate(product._id, {
      name: name || product.name,
      sku: sku || product.sku,
      description: description !== undefined ? description : product.description,
      category: category || product.category,
      supplier: supplier || product.supplier,
      buyingPrice: buyingPrice !== undefined ? Number(buyingPrice) : product.buyingPrice,
      sellingPrice: sellingPrice !== undefined ? Number(sellingPrice) : product.sellingPrice,
      reorderPoint: reorderPoint !== undefined ? Number(reorderPoint) : product.reorderPoint,
      unit: unit || product.unit,
      tags: tags || product.tags,
      image: image !== undefined ? image : product.image,
      isActive: isActive !== undefined ? isActive : product.isActive
    }, { new: true });

    // Warning validation if selling price < buying price
    let warning = null;
    if (updated.sellingPrice < updated.buyingPrice) {
      warning = "Warning: Selling price is less than buying price. Margin is negative.";
    }

    return res.status(200).json({ success: true, product: updated, warning });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating product' });
  }
};

// Soft Delete Product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, shop: req.user.shopId, isDeleted: { $ne: true } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Perform Soft Delete
    await Product.findByIdAndUpdate(product._id, { isDeleted: true });

    return res.status(200).json({ success: true, message: `Product '${product.name}' was successfully deleted.` });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting product' });
  }
};

// Get Low Stock Products
const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ shop: req.user.shopId, isDeleted: { $ne: true } });
    // Filter locally to compare stockQty and reorderPoint
    const lowStock = products.filter(p => p.stockQty <= p.reorderPoint);
    return res.status(200).json({ success: true, count: lowStock.length, products: lowStock });
  } catch (error) {
    console.error('Low stock query error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching low stock products' });
  }
};

// Manual Stock Adjustment
const adjustStock = async (req, res) => {
  try {
    const { adjustmentQty, notes } = req.body;
    const shopId = req.user.shopId;

    if (adjustmentQty === undefined || Number(adjustmentQty) === 0) {
      return res.status(400).json({ success: false, message: 'Please provide a non-zero adjustment quantity' });
    }

    const product = await Product.findOne({ _id: req.params.id, shop: shopId, isDeleted: { $ne: true } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const qtyChange = Number(adjustmentQty);
    const beforeStock = product.stockQty;
    const afterStock = beforeStock + qtyChange;

    if (afterStock < 0) {
      return res.status(400).json({ success: false, message: `Invalid adjustment. Stock cannot fall below 0. Current stock: ${beforeStock}` });
    }

    // Save updated stock
    const updated = await Product.findByIdAndUpdate(product._id, { stockQty: afterStock }, { new: true });

    // Record Stock Movement
    await StockMovement.create({
      product: product._id,
      type: 'manual_adjustment',
      quantityChange: qtyChange,
      stockBefore: beforeStock,
      stockAfter: afterStock,
      notes: notes || 'Manual inventory adjustment',
      createdBy: req.user._id,
      shop: shopId
    });

    return res.status(200).json({ success: true, product: updated });
  } catch (error) {
    console.error('Adjust stock error:', error);
    return res.status(500).json({ success: false, message: 'Server error adjusting stock quantity' });
  }
};

// --- CATEGORIES CRUD ---

// Get Categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ shop: req.user.shopId });
    
    // Enrich categories with product count
    const enriched = await Promise.all(categories.map(async (cat) => {
      const productCount = await Product.countDocuments({
        category: cat._id,
        shop: req.user.shopId,
        isDeleted: { $ne: true }
      });
      return {
        ...cat,
        productCount
      };
    }));

    return res.status(200).json({ success: true, categories: enriched });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching categories' });
  }
};

// Create Category
const createCategory = async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Please provide category name' });
    }

    // Check if category name exists
    const exists = await Category.findOne({ name: new RegExp(`^${name}$`, 'i'), shop: req.user.shopId });
    if (exists) {
      return res.status(400).json({ success: false, message: `Category '${name}' already exists` });
    }

    const newCat = await Category.create({
      name,
      color: color || '#E07B39',
      shop: req.user.shopId
    });

    return res.status(201).json({ success: true, category: newCat });
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating category' });
  }
};

// Update Category
const updateCategory = async (req, res) => {
  try {
    const { name, color } = req.body;
    const cat = await Category.findOne({ _id: req.params.id, shop: req.user.shopId });
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const updated = await Category.findByIdAndUpdate(cat._id, {
      name: name || cat.name,
      color: color || cat.color
    }, { new: true });

    return res.status(200).json({ success: true, category: updated });
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating category' });
  }
};

// Delete Category
const deleteCategory = async (req, res) => {
  try {
    const cat = await Category.findOne({ _id: req.params.id, shop: req.user.shopId });
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if there are active products using this category
    const productsUsing = await Product.countDocuments({ category: cat._id, shop: req.user.shopId, isDeleted: { $ne: true } });
    if (productsUsing > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. There are ${productsUsing} active products assigned to it.`
      });
    }

    await Category.findByIdAndDelete(cat._id);
    return res.status(200).json({ success: true, message: `Category '${cat.name}' successfully deleted` });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting category' });
  }
};

module.exports = {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  adjustStock,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
