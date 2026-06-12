const { createModel } = require('../config/db');

// --- SHOP SCHEMA ---
const ShopSchema = {
  name: { type: String, required: true },
  logo: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  registrationNumber: { type: String, default: '' },
  currency: { type: String, default: 'USD' },
  taxRate: { type: Number, default: 8.25 }, // Standard sales tax default
  invoicePrefix: { type: String, default: 'PL' },
  lowStockThreshold: { type: Number, default: 10 },
  alertEmail: { type: String, default: '' },
  createdBy: { type: String }, // User ID
};

// --- USER SCHEMA ---
const UserSchema = {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'cashier'], default: 'cashier' },
  avatar: { type: String, default: '' },
  shopId: { type: String, ref: 'Shop' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  refreshToken: { type: String, default: '' },
  passwordResetToken: { type: String, default: '' },
  passwordResetExpiry: { type: Date },
};

// --- PRODUCT SCHEMA ---
const ProductSchema = {
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  category: { type: String, ref: 'Category', required: true },
  supplier: { type: String, ref: 'Supplier', required: true },
  buyingPrice: { type: Number, required: true, default: 0 },
  sellingPrice: { type: Number, required: true, default: 0 },
  stockQty: { type: Number, required: true, default: 0 },
  reorderPoint: { type: Number, required: true, default: 5 },
  unit: { type: String, default: 'pcs' },
  image: { type: String, default: '' },
  tags: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  shop: { type: String, ref: 'Shop', required: true },
  createdBy: { type: String },
};

// --- CATEGORY SCHEMA ---
const CategorySchema = {
  name: { type: String, required: true },
  color: { type: String, default: '#E07B39' },
  shop: { type: String, ref: 'Shop', required: true },
};

// --- SUPPLIER SCHEMA ---
const SupplierSchema = {
  companyName: { type: String, required: true },
  contactPerson: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  city: { type: String, default: '' },
  address: { type: String, default: '' },
  taxId: { type: String, default: '' }, // Renamed from cnic for global neutrality
  paymentTerms: { type: String, default: 'Net 30' }, // Net 7, Net 15, Net 30, Cash on Delivery
  notes: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  shop: { type: String, ref: 'Shop', required: true },
};

// --- SALE SCHEMA ---
const SaleSchema = {
  invoiceNumber: { type: String, required: true, unique: true },
  customer: {
    name: { type: String, default: 'Walking Customer' },
    phone: { type: String, default: '' }
  },
  items: [{
    product: { type: String, ref: 'Product', required: true },
    productName: { type: String, required: true },
    qty: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  netTotal: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'Credit Card', 'Bank Transfer'], default: 'Cash' },
  status: { type: String, enum: ['Completed', 'Refunded', 'Partial'], default: 'Completed' },
  notes: { type: String, default: '' },
  createdBy: { type: String, required: true },
  shop: { type: String, ref: 'Shop', required: true },
};

// --- PURCHASE ORDER SCHEMA ---
const PurchaseOrderSchema = {
  poNumber: { type: String, required: true, unique: true },
  supplier: { type: String, ref: 'Supplier', required: true },
  items: [{
    product: { type: String, ref: 'Product', required: true },
    productName: { type: String, required: true },
    qty: { type: Number, required: true },
    unitCost: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  totalValue: { type: Number, required: true },
  expectedDelivery: { type: String },
  paymentTerms: { type: String, default: 'Net 30' },
  status: { type: String, enum: ['Draft', 'Sent', 'Partial', 'Received'], default: 'Draft' },
  notes: { type: String, default: '' },
  createdBy: { type: String, required: true },
  shop: { type: String, ref: 'Shop', required: true },
};

// --- RETURN SCHEMA ---
const ReturnSchema = {
  returnNumber: { type: String, required: true, unique: true },
  type: { type: String, enum: ['sale_return', 'purchase_return'], required: true },
  referenceId: { type: String, required: true }, // Sale ID or PO ID
  referenceModel: { type: String, required: true }, // 'Sale' or 'PurchaseOrder'
  items: [{
    product: { type: String, ref: 'Product', required: true },
    qty: { type: Number, required: true },
    reason: { type: String, default: '' } // Damaged, Wrong Item, Expired, etc.
  }],
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  notes: { type: String, default: '' },
  processedBy: { type: String, required: true },
  shop: { type: String, ref: 'Shop', required: true },
};

// --- STOCK MOVEMENT SCHEMA ---
const StockMovementSchema = {
  product: { type: String, ref: 'Product', required: true },
  type: { type: String, enum: ['sale', 'purchase', 'return', 'manual_adjustment'], required: true },
  quantityChange: { type: Number, required: true }, // positive or negative
  stockBefore: { type: Number, required: true },
  stockAfter: { type: Number, required: true },
  referenceType: { type: String }, // 'Sale', 'PurchaseOrder', 'Return'
  referenceId: { type: String },
  notes: { type: String, default: '' },
  createdBy: { type: String, required: true },
  shop: { type: String, ref: 'Shop', required: true },
};

// Registering models through the database provider
const Shop = createModel('Shop', ShopSchema);
const User = createModel('User', UserSchema);
const Product = createModel('Product', ProductSchema);
const Category = createModel('Category', CategorySchema);
const Supplier = createModel('Supplier', SupplierSchema);
const Sale = createModel('Sale', SaleSchema);
const PurchaseOrder = createModel('PurchaseOrder', PurchaseOrderSchema);
const Return = createModel('Return', ReturnSchema);
const StockMovement = createModel('StockMovement', StockMovementSchema);

module.exports = {
  Shop,
  User,
  Product,
  Category,
  Supplier,
  Sale,
  PurchaseOrder,
  Return,
  StockMovement
};
