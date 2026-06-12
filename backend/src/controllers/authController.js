const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, Shop } = require('../models');

// Helper to generate JWT access token
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'precision_secret_key_123', {
    expiresIn: '15m',
  });
};

// Helper to generate JWT refresh token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'precision_refresh_secret_key_789', {
    expiresIn: '7d',
  });
};

// Register Owner & Shop
const register = async (req, res) => {
  try {
    const { name, email, password, shopName } = req.body;

    if (!name || !email || !password || !shopName) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, password, and shopName' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: `Could not register — Email '${email}' is already registered.` });
    }

    // Create Shop first
    const newShop = await Shop.create({
      name: shopName,
      currency: 'USD',
      taxRate: 8.25,
      invoicePrefix: shopName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'SL'),
      lowStockThreshold: 10,
      alertEmail: email.toLowerCase()
    });

    // Hash Password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user associated with the shop
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      shopId: newShop._id,
      isActive: true
    });

    // Update Shop's createdBy reference
    await Shop.findByIdAndUpdate(newShop._id, { createdBy: newUser._id });

    // Generate tokens
    const accessToken = generateAccessToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);

    // Save refresh token on user
    await User.findByIdAndUpdate(newUser._id, { refreshToken });

    // Set HTTP-Only Cookie for Refresh Token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(201).json({
      success: true,
      accessToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        shopId: newUser.shopId
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// Login User
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your email and password.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your email and password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is currently deactivated. Contact administration.' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token & update last login
    await User.findByIdAndUpdate(user._id, {
      refreshToken,
      lastLogin: new Date().toISOString()
    });

    // Set HTTP-Only Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopId: user.shopId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// Logout User
const logout = async (req, res) => {
  try {
    const cookieToken = req.cookies ? req.cookies.refreshToken : null;
    const token = cookieToken || req.body.refreshToken;

    if (token) {
      // Find user and remove refresh token
      const decoded = jwt.decode(token);
      if (decoded && decoded.id) {
        await User.findByIdAndUpdate(decoded.id, { refreshToken: '' });
      }
    }

    // Clear HTTP-Only Cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};

// Refresh Access Token
const refresh = async (req, res) => {
  try {
    const cookieToken = req.cookies ? req.cookies.refreshToken : null;
    const token = cookieToken || req.body.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token is missing' });
    }

    // Verify Refresh Token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'precision_refresh_secret_key_789');

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const newAccessToken = generateAccessToken(user._id);

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('Refresh token error:', error.message);
    return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Avoid revealing if user exists or not, but return mock success
      return res.status(200).json({ success: true, message: 'If this email is registered, a password reset link has been dispatched.' });
    }

    // Generate Token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = Date.now() + 15 * 60 * 1000; // 15 mins

    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: resetToken,
      passwordResetExpiry: new Date(resetExpiry).toISOString()
    });

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    
    // Log token link to console in development
    console.log(`[EMAIL SYSTEM SIMULATOR] Reset link for ${email}: ${resetUrl}`);

    // If nodemailer configured, it would send here. For now we simulate success.
    return res.status(200).json({
      success: true,
      message: 'Password reset link has been sent to your email.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing forgot password request' });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Please enter a new password' });
    }

    const user = await User.findOne({
      passwordResetToken: token
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Check expiry
    const now = new Date();
    const expiry = new Date(user.passwordResetExpiry);
    if (now > expiry) {
      return res.status(400).json({ success: false, message: 'Reset token has expired (15 minute limit)' });
    }

    // Hash New Password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      passwordResetToken: '',
      passwordResetExpiry: null,
      refreshToken: '' // Revoke active sessions for security
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset completed successfully. You can now login.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server error during password reset' });
  }
};

// Get Current User Profile & Shop Settings
const getMe = async (req, res) => {
  try {
    const user = req.user;
    const shop = await Shop.findById(user.shopId);

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive
      },
      shop
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching user profile' });
  }
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  getMe
};
