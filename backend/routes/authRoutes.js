const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new farmer or user
// @access  Public
// Business Rules:
// - Farmers: Sell only milk (not milk products), require Aadhar
// - Users: Buy only milk from the society
// - Admin: Can provide notifications to farmers about cattle feeds and other products
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone, aadhar, role, address } = req.body;

    console.log('Registration attempt:', { username, email, role });

    // Validate role
    if (!['farmer', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Only farmer and user can register.'
      });
    }

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided including address'
      });
    }

    // Validate Aadhar for farmers
    if (role === 'farmer' && !aadhar) {
      return res.status(400).json({
        success: false,
        message: 'Aadhar number is required for farmers'
      });
    }

    // Check if user/farmer already exists across all collections
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    const existingFarmer = await Farmer.findOne({ $or: [{ email }, { username }] });
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });

    if (existingUser || existingFarmer || existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    let newRecord;
    let userData;

    if (role === 'farmer') {
      // Create farmer in farmers collection
      newRecord = new Farmer({
        username,
        email,
        password,
        firstName,
        lastName,
        phone,
        address,
        aadhar
      });
      await newRecord.save();
      userData = {
        id: newRecord._id,
        username: newRecord.username,
        email: newRecord.email,
        role: 'farmer',
        firstName: newRecord.firstName,
        lastName: newRecord.lastName
      };
    } else {
      // Create user in users collection
      newRecord = new User({
        username,
        email,
        password,
        firstName,
        lastName,
        phone,
        address
      });
      await newRecord.save();
      userData = {
        id: newRecord._id,
        username: newRecord.username,
        email: newRecord.email,
        role: 'user',
        firstName: newRecord.firstName,
        lastName: newRecord.lastName
      };
    }

    // Generate token
    const token = generateToken(newRecord._id, role);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Registration error:', error);

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists. Please use a different ${field}.`
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    // Log full error for debugging
    console.error('Full registration error:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration. Please check server logs.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user (checks users, farmers, and admins collections)
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Find user by username or email across all collections
    const searchTerm = username.toLowerCase().trim();

    let user = await Admin.findOne({
      $or: [{ username: searchTerm }, { email: searchTerm }]
    });
    let userRole = 'admin';
    let userCollection = 'admins';

    if (!user) {
      user = await Farmer.findOne({
        $or: [{ username: searchTerm }, { email: searchTerm }]
      });
      if (user) {
        userRole = 'farmer';
        userCollection = 'farmers';
      }
    }

    if (!user) {
      user = await User.findOne({
        $or: [{ username: searchTerm }, { email: searchTerm }]
      });
      if (user) {
        userRole = 'user';
        userCollection = 'users';
      }
    }

    console.log('Login attempt:', {
      searchTerm,
      userFound: !!user,
      userRole: userRole,
      collection: userCollection
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact admin.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    console.log('Password check:', {
      username: user.username,
      role: userRole,
      passwordValid: isPasswordValid
    });

    if (!isPasswordValid) {
      console.log('❌ Password mismatch for user:', user.username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id, userRole);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: userRole,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId, role } = decoded;

    let user;
    if (role === 'admin') {
      user = await Admin.findById(userId).select('-password');
    } else if (role === 'farmer') {
      user = await Farmer.findById(userId).select('-password');
    } else {
      user = await User.findById(userId).select('-password');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

module.exports = router;
