const bcrypt = require('bcryptjs');
const { Shop, User } = require('../models');

// --- STORE PROFILE SETTINGS ---

const getStoreSettings = async (req, res) => {
  try {
    const shop = await Shop.findById(req.user.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop details not found' });
    }
    return res.status(200).json({ success: true, shop });
  } catch (error) {
    console.error('Get store settings error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving shop configurations' });
  }
};

const updateStoreSettings = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { name, address, city, registrationNumber, currency, taxRate, invoicePrefix, lowStockThreshold, alertEmail } = req.body;

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop configuration not found' });
    }

    const updated = await Shop.findByIdAndUpdate(shopId, {
      name: name || shop.name,
      address: address !== undefined ? address : shop.address,
      city: city !== undefined ? city : shop.city,
      registrationNumber: registrationNumber !== undefined ? registrationNumber : shop.registrationNumber,
      currency: currency || shop.currency,
      taxRate: taxRate !== undefined ? Number(taxRate) : shop.taxRate,
      invoicePrefix: invoicePrefix || shop.invoicePrefix,
      lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : shop.lowStockThreshold,
      alertEmail: alertEmail !== undefined ? alertEmail.toLowerCase() : shop.alertEmail
    }, { new: true });

    return res.status(200).json({ success: true, shop: updated });
  } catch (error) {
    console.error('Update store settings error:', error);
    return res.status(500).json({ success: false, message: 'Server error saving shop configurations' });
  }
};

// --- USER & ROLES SECTION (ADMIN ONLY) ---

// Get all users in the shop
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ shopId: req.user.shopId });
    // Remove passwords before returning
    const safeUsers = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt
    }));
    return res.status(200).json({ success: true, users: safeUsers });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving shop accounts' });
  }
};

// Add / Invite User
const inviteUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const shopId = req.user.shopId;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, password, and role' });
    }

    // Check email availability
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: `Could not invite — Email '${email}' is already registered.` });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      shopId,
      isActive: true
    });

    console.log(`[USER INVITE SYSTEM] Created user ${name} with role ${role}. Onboarding link simulation sent.`);

    return res.status(201).json({
      success: true,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive
      }
    });
  } catch (error) {
    console.error('Invite user error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating user account' });
  }
};

// Update User Role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'manager', 'cashier'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role selection' });
    }

    const targetUser = await User.findOne({ _id: req.params.id, shopId: req.user.shopId });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found in this shop' });
    }

    // Prevent changing own role
    if (String(targetUser._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot alter your own admin privileges.' });
    }

    const updated = await User.findByIdAndUpdate(targetUser._id, { role }, { new: true });
    return res.status(200).json({
      success: true,
      user: {
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating user role' });
  }
};

// Deactivate / Reactivate User
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (isActive === undefined) {
      return res.status(400).json({ success: false, message: 'Status (isActive) parameter is required' });
    }

    const targetUser = await User.findOne({ _id: req.params.id, shopId: req.user.shopId });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found in this shop' });
    }

    // Prevent deactivating oneself
    if (String(targetUser._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
    }

    const updated = await User.findByIdAndUpdate(targetUser._id, { isActive }, { new: true });
    return res.status(200).json({
      success: true,
      user: {
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        isActive: updated.isActive
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating user account status' });
  }
};

// Delete User from shop
const deleteUser = async (req, res) => {
  try {
    const targetUser = await User.findOne({ _id: req.params.id, shopId: req.user.shopId });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found in this shop' });
    }

    // Prevent deleting oneself
    if (String(targetUser._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    await User.findByIdAndDelete(targetUser._id);
    return res.status(200).json({ success: true, message: 'User account has been successfully removed.' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting user account' });
  }
};

module.exports = {
  getStoreSettings,
  updateStoreSettings,
  getUsers,
  inviteUser,
  updateUserRole,
  updateUserStatus,
  deleteUser
};
