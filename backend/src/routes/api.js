const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Controllers
const authCtrl = require('../controllers/authController');
const prodCtrl = require('../controllers/productController');
const suppCtrl = require('../controllers/supplierController');
const txCtrl = require('../controllers/transactionController');
const rptCtrl = require('../controllers/reportController');
const settCtrl = require('../controllers/settingsController');

// --- AUTHENTICATION ROUTES ---
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.post('/auth/logout', authCtrl.logout);
router.post('/auth/refresh', authCtrl.refresh);
router.post('/auth/forgot-password', authCtrl.forgotPassword);
router.post('/auth/reset-password/:token', authCtrl.resetPassword);
router.get('/auth/me', protect, authCtrl.getMe);

// --- PRODUCTS ROUTES ---
router.get('/products/low-stock', protect, prodCtrl.getLowStockProducts);
router.get('/products', protect, prodCtrl.getProducts);
router.post('/products', protect, prodCtrl.createProduct);
router.get('/products/:id', protect, prodCtrl.getProductById);
router.put('/products/:id', protect, prodCtrl.updateProduct);
router.delete('/products/:id', protect, prodCtrl.deleteProduct);
router.patch('/products/:id/stock', protect, prodCtrl.adjustStock);

// --- CATEGORIES ROUTES ---
router.get('/categories', protect, prodCtrl.getCategories);
router.post('/categories', protect, prodCtrl.createCategory);
router.put('/categories/:id', protect, prodCtrl.updateCategory);
router.delete('/categories/:id', protect, prodCtrl.deleteCategory);

// --- SUPPLIERS ROUTES ---
router.get('/suppliers', protect, suppCtrl.getSuppliers);
router.post('/suppliers', protect, suppCtrl.createSupplier);
router.get('/suppliers/:id', protect, suppCtrl.getSupplierById);
router.put('/suppliers/:id', protect, suppCtrl.updateSupplier);
router.delete('/suppliers/:id', protect, suppCtrl.deleteSupplier);

// --- SALES TRANSACTION ROUTES ---
router.get('/sales', protect, txCtrl.getSales);
router.post('/sales', protect, txCtrl.createSale);
router.get('/sales/:id', protect, txCtrl.getSaleById);

// --- PURCHASE TRANSACTION ROUTES ---
router.get('/purchases', protect, txCtrl.getPurchases);
router.post('/purchases', protect, txCtrl.createPurchaseOrder);
router.patch('/purchases/:id/receive', protect, txCtrl.receivePurchaseOrder);
router.delete('/purchases/:id', protect, txCtrl.deletePurchaseOrder);

// --- RETURNS TRANSACTION ROUTES ---
router.get('/returns', protect, txCtrl.getReturns);
router.post('/returns', protect, txCtrl.createReturn);
router.patch('/returns/:id/status', protect, txCtrl.updateReturnStatus);

// --- REPORTING & STATS ROUTES ---
router.get('/reports/overview', protect, rptCtrl.getDashboardStats);
router.get('/reports/charts', protect, rptCtrl.getDashboardCharts);
router.get('/reports/sales', protect, rptCtrl.getSalesReport);
router.get('/reports/purchases', protect, rptCtrl.getPurchaseReport);
router.get('/reports/inventory', protect, rptCtrl.getInventoryReport);
router.get('/reports/profit-loss', protect, rptCtrl.getProfitLossReport);

// --- SETTINGS & USERS (ADMIN ACCESS RESTRICTED) ---
router.get('/settings/store', protect, settCtrl.getStoreSettings);
router.put('/settings/store', protect, settCtrl.updateStoreSettings);

router.get('/settings/users', protect, authorize('admin'), settCtrl.getUsers);
router.post('/settings/users/invite', protect, authorize('admin'), settCtrl.inviteUser);
router.put('/settings/users/:id/role', protect, authorize('admin'), settCtrl.updateUserRole);
router.patch('/settings/users/:id/status', protect, authorize('admin'), settCtrl.updateUserStatus);
router.delete('/settings/users/:id', protect, authorize('admin'), settCtrl.deleteUser);

module.exports = router;
