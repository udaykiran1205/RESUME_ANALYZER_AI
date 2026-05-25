const { validationResult } = require('express-validator');
const https = require('https');
const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');

// ─── Helper: format user response ─────────────────────────────────────────────
const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  role: user.role,
  initials: user.initials,
  resumeCount: user.resumeCount,
  preferences: user.preferences,
  createdAt: user.createdAt,
  lastLogin: user.lastLogin,
});

// ─── @route   POST /api/auth/register ─────────────────────────────────────────
// ─── @desc    Register new user ───────────────────────────────────────────────
// ─── @access  Public ──────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Create user
    const user = await User.create({ name, email, password });
    await user.updateLastLogin();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to AI Resume Analyzer 🎉',
      token,
      user: userResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route   POST /api/auth/login ────────────────────────────────────────────
// ─── @desc    Login user & return token ───────────────────────────────────────
// ─── @access  Public ──────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { email, password } = req.body;

    // Find user with password
    const user = await User.findByEmailWithPassword(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    await user.updateLastLogin();
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}! 👋`,
      token,
      user: userResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route   GET /api/auth/me ────────────────────────────────────────────────
// ─── @desc    Get current authenticated user ───────────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: userResponse(user) });
  } catch (error) {
    next(error);
  }
};

// ─── @route   PUT /api/auth/profile ───────────────────────────────────────────
// ─── @desc    Update user profile ────────────────────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, preferences } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();
    res.json({ success: true, message: 'Profile updated', user: userResponse(user) });
  } catch (error) {
    next(error);
  }
};

// ─── @route   POST /api/auth/logout ───────────────────────────────────────────
// ─── @desc    Logout (client-side token clear, but acknowledged here) ─────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

// ─── Helper: verify Google ID token via tokeninfo endpoint ────────────────────
const verifyGoogleToken = (credential) => {
  return new Promise((resolve, reject) => {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const payload = JSON.parse(data);
          if (payload.error) return reject(new Error(payload.error_description || 'Invalid token'));
          // Verify audience matches our client ID
          const clientId = process.env.GOOGLE_CLIENT_ID;
          if (clientId && payload.aud !== clientId) {
            return reject(new Error('Token audience mismatch'));
          }
          resolve(payload);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

// ─── @route   POST /api/auth/google ───────────────────────────────────────────
// ─── @desc    Authenticate with Google OAuth ───────────────────────────────────
// ─── @access  Public ──────────────────────────────────────────────────────────
const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }

    // Verify the Google ID token
    let payload;
    try {
      payload = await verifyGoogleToken(credential);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid Google token: ' + err.message });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account has no email' });
    }

    // Find existing user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Update Google ID and avatar if not set
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatar && picture) user.avatar = picture;
      await user.updateLastLogin();
    } else {
      // Create new user
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        avatar: picture || '',
        isVerified: true, // Google accounts are pre-verified
      });
      await user.updateLastLogin();
    }

    const token = generateToken(user._id);
    const isNew = !user.createdAt || (Date.now() - new Date(user.createdAt).getTime()) < 5000;

    res.json({
      success: true,
      message: isNew ? 'Account created with Google! Welcome 🎉' : `Welcome back, ${user.name}! 👋`,
      token,
      user: userResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route   POST /api/auth/change-password ──────────────────────────────────
// ─── @desc    Change user password ───────────────────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.googleId && !user.password) {
      return res.status(400).json({ success: false, message: 'Google accounts cannot change password this way' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, logout, googleAuth, changePassword };
