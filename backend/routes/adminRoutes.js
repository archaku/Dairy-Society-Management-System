const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Middleware to verify admin
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const admin = await Admin.findById(decoded.userId);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Admin not found or inactive' });
    }

    req.adminId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/admin/farmers
// @desc    Get all farmers
// @access  Admin
router.get('/farmers', verifyAdmin, async (req, res) => {
  try {
    const farmers = await Farmer.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, farmers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/admin/users
// @desc    Create a new user
// @access  Admin
router.post('/users', verifyAdmin, async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    const existingFarmer = await Farmer.findOne({ $or: [{ email }, { username }] });
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });

    if (existingUser || existingFarmer || existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      address
    });

    await user.save();
    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({ success: true, message: 'User created successfully', user: userData });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/admin/farmers
// @desc    Create a new farmer
// @access  Admin
router.post('/farmers', verifyAdmin, async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone, address, aadhar } = req.body;

    if (!aadhar) {
      return res.status(400).json({
        success: false,
        message: 'Aadhar number is required for farmers'
      });
    }

    // Check if farmer already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    const existingFarmer = await Farmer.findOne({ $or: [{ email }, { username }] });
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });

    if (existingUser || existingFarmer || existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    const farmer = new Farmer({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      address,
      aadhar
    });

    await farmer.save();
    const farmerData = farmer.toObject();
    delete farmerData.password;

    res.status(201).json({ success: true, message: 'Farmer created successfully', farmer: farmerData });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update a user
// @access  Admin
router.put('/users/:id', verifyAdmin, async (req, res) => {
  try {
    const { firstName, lastName, phone, address, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();
    const userData = user.toObject();
    delete userData.password;

    res.json({ success: true, message: 'User updated successfully', user: userData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/farmers/:id
// @desc    Update a farmer
// @access  Admin
router.put('/farmers/:id', verifyAdmin, async (req, res) => {
  try {
    const { firstName, lastName, phone, address, aadhar, isActive } = req.body;
    const farmer = await Farmer.findById(req.params.id);

    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    if (firstName) farmer.firstName = firstName;
    if (lastName) farmer.lastName = lastName;
    if (phone) farmer.phone = phone;
    if (address) farmer.address = address;
    if (aadhar) farmer.aadhar = aadhar;
    if (typeof isActive === 'boolean') farmer.isActive = isActive;

    await farmer.save();
    const farmerData = farmer.toObject();
    delete farmerData.password;

    res.json({ success: true, message: 'Farmer updated successfully', farmer: farmerData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Admin
router.delete('/users/:id', verifyAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/admin/farmers/:id
// @desc    Delete a farmer
// @access  Admin
router.delete('/farmers/:id', verifyAdmin, async (req, res) => {
  try {
    const farmer = await Farmer.findByIdAndDelete(req.params.id);
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }
    res.json({ success: true, message: 'Farmer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
