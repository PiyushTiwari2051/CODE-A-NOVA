const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Configs & Routes
dotenv.config();
const { connectDB, isMock } = require('./config/db');
const apiRoutes = require('./routes/api');

// Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow all local hosts and CLI origins in development, or static domains
    if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin) || origin === process.env.CLIENT_URL) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));

// Rate Limiter: 200 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

// Body Parsers & Sanitizers
app.use(express.json({ limit: '10mb' }));
app.use(mongoSanitize());
app.use(xss());

// Manual Cookie Parser Middleware for JWT refresh tokens
app.use((req, res, next) => {
  req.cookies = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts[0] && parts[1]) {
        req.cookies[parts[0].trim()] = parts[1].trim();
      }
    });
  }
  next();
});

// Logger
app.use(morgan('dev'));

// Core Routes
app.use('/api', apiRoutes);

// Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Precision Ledger API',
    message: 'Welcome to the Precision Ledger Backend API',
    status: 'healthy',
    database: isMock() ? 'local_json_db' : 'mongodb_atlas'
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', database: isMock() ? 'local_json_db' : 'mongodb_atlas' });
});

// Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Seeding Function
const seedDatabase = async () => {
  try {
    const { User, Shop, Category, Supplier, Product, Sale, PurchaseOrder, StockMovement } = require('./models');
    
    // Check if users already exist
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('[SEED] Database already contains records. Skipping seed.');
      return;
    }

    console.log('[SEED] Seeding database with premium global artisan goods...');

    // 1. Create Default Shop
    const shop = await Shop.create({
      name: "Artisan Ledger Co.",
      currency: "USD",
      taxRate: 8.25,
      invoicePrefix: "ART",
      lowStockThreshold: 10,
      alertEmail: "owner@artisanledger.com"
    });

    // 2. Create Default Admin User
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const admin = await User.create({
      name: "Arthur Pendelton",
      email: "admin@precisionledger.com",
      password: hashedPassword,
      role: "admin",
      shopId: shop._id,
      isActive: true
    });

    // Update Shop createdBy reference
    await Shop.findByIdAndUpdate(shop._id, { createdBy: admin._id });

    // 3. Create Categories
    const catGourmet = await Category.create({ name: "Gourmet Foods", color: "#E07B39", shop: shop._id });
    const catStationery = await Category.create({ name: "Stationery & Leather", color: "#1A2B4A", shop: shop._id });
    const catApparel = await Category.create({ name: "Specialty Apparel", color: "#2E7D32", shop: shop._id });
    const catCosmetics = await Category.create({ name: "Organic Cosmetics", color: "#B45309", shop: shop._id });

    // 4. Create Suppliers
    const suppVermont = await Supplier.create({
      companyName: "Vermont Artisan Distributors",
      contactPerson: "Sarah Jenkins",
      email: "sarah@vermontdistributors.com",
      phone: "+1-802-555-0143",
      city: "Burlington",
      address: "120 Pine Street",
      taxId: "TX-904-88A",
      paymentTerms: "Net 30",
      notes: "Primary organic supplier",
      isActive: true,
      shop: shop._id
    });

    const suppHeritage = await Supplier.create({
      companyName: "Heritage Leather Wholesalers",
      contactPerson: "David Miller",
      email: "david@heritageleather.com",
      phone: "+1-617-555-9821",
      city: "Boston",
      address: "45 Commercial Wharf",
      taxId: "TX-782-99L",
      paymentTerms: "Net 15",
      notes: "Genuine leather journals and bags",
      isActive: true,
      shop: shop._id
    });

    const suppPacific = await Supplier.create({
      companyName: "Pacific Organic Farms",
      contactPerson: "Elena Rodriguez",
      email: "elena@pacificfarms.com",
      phone: "+1-310-555-8930",
      city: "Santa Monica",
      address: "800 Ocean Ave",
      taxId: "TX-112-66Z",
      paymentTerms: "Cash on Delivery",
      notes: "Soaps, cosmetic bases, cold-pressed oils",
      isActive: true,
      shop: shop._id
    });

    // 5. Create Products
    const prodMatcha = await Product.create({
      name: "Organic Ceremonial Matcha Powder",
      sku: "MAT-GOUR-8902",
      description: "Stone-ground organic Japanese ceremonial grade matcha powder. 100g tin.",
      category: catGourmet._id,
      supplier: suppVermont._id,
      buyingPrice: 12.50,
      sellingPrice: 28.00,
      stockQty: 45,
      reorderPoint: 10,
      unit: "tin",
      image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=300&auto=format&fit=crop",
      tags: ["Organic", "Matcha", "Tea"],
      shop: shop._id,
      createdBy: admin._id
    });

    const prodPaprika = await Product.create({
      name: "Smoked Spanish Paprika Jar",
      sku: "PAP-GOUR-4412",
      description: "Oak-smoked Spanish sweet paprika in traditional tin jar. 75g.",
      category: catGourmet._id,
      supplier: suppVermont._id,
      buyingPrice: 3.20,
      sellingPrice: 8.50,
      stockQty: 8, // Low Stock!
      reorderPoint: 10,
      unit: "jar",
      image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=300&auto=format&fit=crop",
      tags: ["Spice", "Imported"],
      shop: shop._id,
      createdBy: admin._id
    });

    const prodJournal = await Product.create({
      name: "Handcrafted Grain Leather Journal",
      sku: "JOU-STAT-2391",
      description: "Top-grain buffalo leather journal with unlined parchment paper. Handbound.",
      category: catStationery._id,
      supplier: suppHeritage._id,
      buyingPrice: 14.00,
      sellingPrice: 35.00,
      stockQty: 18,
      reorderPoint: 5,
      unit: "pcs",
      image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop",
      tags: ["Leather", "Handmade"],
      shop: shop._id,
      createdBy: admin._id
    });

    const prodTee = await Product.create({
      name: "Heavyweight Cotton Vintage Tee",
      sku: "TEE-APPA-7721",
      description: "240gsm heavyweight vintage wash cotton tee in pepper gray.",
      category: catApparel._id,
      supplier: suppHeritage._id,
      buyingPrice: 8.50,
      sellingPrice: 22.00,
      stockQty: 32,
      reorderPoint: 10,
      unit: "pcs",
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300&auto=format&fit=crop",
      tags: ["Apparel", "Cotton"],
      shop: shop._id,
      createdBy: admin._id
    });

    const prodOliveOil = await Product.create({
      name: "Cold Pressed Olive Oil",
      sku: "OIO-GOUR-1109",
      description: "Single-origin early harvest extra virgin olive oil. 500ml glass bottle.",
      category: catGourmet._id,
      supplier: suppPacific._id,
      buyingPrice: 9.00,
      sellingPrice: 24.00,
      stockQty: 0, // Out of Stock!
      reorderPoint: 8,
      unit: "bottle",
      image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=300&auto=format&fit=crop",
      tags: ["Oil", "Imported"],
      shop: shop._id,
      createdBy: admin._id
    });

    const prodSoap = await Product.create({
      name: "Organic French Lavender Soap Bar",
      sku: "SOP-COSM-5002",
      description: "Triple-milled organic soap bar with lavender buds and essential oils.",
      category: catCosmetics._id,
      supplier: suppPacific._id,
      buyingPrice: 1.80,
      sellingPrice: 5.50,
      stockQty: 55,
      reorderPoint: 15,
      unit: "pcs",
      image: "https://images.unsplash.com/photo-1607006342445-5207b8cc7c62?q=80&w=300&auto=format&fit=crop",
      tags: ["Soap", "Lavender"],
      shop: shop._id,
      createdBy: admin._id
    });

    // Add Initial Stock Movement Records
    const seededProducts = [prodMatcha, prodPaprika, prodJournal, prodTee, prodSoap];
    for (let p of seededProducts) {
      await StockMovement.create({
        product: p._id,
        type: 'manual_adjustment',
        quantityChange: p.stockQty,
        stockBefore: 0,
        stockAfter: p.stockQty,
        notes: 'Initial seed stock load',
        createdBy: admin._id,
        shop: shop._id
      });
    }

    // 6. Seed some mock sales (for reports and line charts)
    console.log('[SEED] Seeding historical transaction records...');
    
    // Day -1 Sale
    const day1SaleCount = await Sale.countDocuments({ shop: shop._id });
    const sale1 = await Sale.create({
      invoiceNumber: `INV-ART-${padZero(day1SaleCount + 1, 5)}`,
      customer: { name: "John Doe", phone: "+1-212-555-0199" },
      items: [
        { product: prodMatcha._id, productName: prodMatcha.name, qty: 2, unitPrice: prodMatcha.sellingPrice, discount: 0, total: 56.00, buyingPrice: prodMatcha.buyingPrice },
        { product: prodJournal._id, productName: prodJournal.name, qty: 1, unitPrice: prodJournal.sellingPrice, discount: 5.00, total: 30.00, buyingPrice: prodJournal.buyingPrice }
      ],
      subtotal: 91.00,
      discount: 5.00,
      tax: 7.10,
      netTotal: 93.10,
      paymentMethod: "Credit Card",
      status: "Completed",
      notes: "Regular loyalty customer",
      createdBy: admin._id,
      shop: shop._id,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
    });

    // Day -2 Sale
    const day2SaleCount = await Sale.countDocuments({ shop: shop._id });
    const sale2 = await Sale.create({
      invoiceNumber: `INV-ART-${padZero(day2SaleCount + 1, 5)}`,
      customer: { name: "Alice Springs", phone: "+1-415-555-0102" },
      items: [
        { product: prodTee._id, productName: prodTee.name, qty: 3, unitPrice: prodTee.sellingPrice, discount: 0, total: 66.00, buyingPrice: prodTee.buyingPrice },
        { product: prodSoap._id, productName: prodSoap.name, qty: 5, unitPrice: prodSoap.sellingPrice, discount: 0, total: 27.50, buyingPrice: prodSoap.buyingPrice }
      ],
      subtotal: 93.50,
      discount: 0,
      tax: 7.71,
      netTotal: 101.21,
      paymentMethod: "Cash",
      status: "Completed",
      notes: "",
      createdBy: admin._id,
      shop: shop._id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    });

    // Update product stock counts according to mock sales
    await Product.findByIdAndUpdate(prodMatcha._id, { stockQty: prodMatcha.stockQty - 2 });
    await Product.findByIdAndUpdate(prodJournal._id, { stockQty: prodJournal.stockQty - 1 });
    await Product.findByIdAndUpdate(prodTee._id, { stockQty: prodTee.stockQty - 3 });
    await Product.findByIdAndUpdate(prodSoap._id, { stockQty: prodSoap.stockQty - 5 });

    // Seed mock Purchase Order (Received)
    const poCount = await PurchaseOrder.countDocuments({ shop: shop._id });
    await PurchaseOrder.create({
      poNumber: `PO-${Date.now().toString().slice(-4)}-${padZero(poCount + 1, 4)}`,
      supplier: suppVermont._id,
      items: [
        { product: prodMatcha._id, productName: prodMatcha.name, qty: 10, unitCost: prodMatcha.buyingPrice, total: 125.00 },
        { product: prodPaprika._id, productName: prodPaprika.name, qty: 5, unitCost: prodPaprika.buyingPrice, total: 16.00 }
      ],
      totalValue: 141.00,
      expectedDelivery: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      paymentTerms: "Net 30",
      status: "Received",
      notes: "Regular restock delivery",
      createdBy: admin._id,
      shop: shop._id,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    });

    console.log('[SEED] Database seeded successfully! Demo admin: admin@precisionledger.com / password123');
  } catch (err) {
    console.error('[SEED ERROR] Failed to seed database:', err);
  }
};

const padZero = (num, size) => {
  let s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
};

// Initialize DB and Listen
const init = async () => {
  await connectDB();
  
  // Seed Database if needed
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`[SERVER] Express server running on port ${PORT}`);
  });
};

init();
