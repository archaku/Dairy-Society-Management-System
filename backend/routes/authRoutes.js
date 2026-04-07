const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const Admin = require('../models/Admin');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

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
    const { username, email, password, firstName, lastName, phone, aadhar, role, address, otp } = req.body;

    console.log('Registration attempt:', { username, email, role });

    // Validate role
    if (!['farmer', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Only farmer and user can register.'
      });
    }

    if (!username || !email || !password || !firstName || !lastName || !phone || !address || !otp) {
      return res.status(400).json({
        success: false,
        message: 'All fields including OTP and address are required'
      });
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Delete OTP record after successful verification (optional, TTL will handle it)
    await OTP.deleteMany({ email });

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

// @route   POST /api/auth/send-otp
// @desc    Send OTP to email
// @access  Public
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Log OTP to console immediately (CRITICAL for testing)
    console.log('-----------------------------------------');
    console.log(`NEW OTP GENERATED for ${email}: ${otp}`);
    console.log('-----------------------------------------');

    // Save OTP to database
    await OTP.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send email
    console.log(`Attempting to send OTP from: ${process.env.EMAIL_USER}`);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification - DSMS',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 1px solid #ddd; border-top: 4px solid #667eea; border-radius: 8px;">
          <h2 style="color: #2c3e50;">DSMS Verification</h2>
          <p>Hi there,</p>
          <p>You requested a verification code for the Dairy Society Management System.</p>
          <div style="background-color: #f1f3f5; padding: 20px; margin: 20px 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; border-radius: 8px; color: #2c3e50;">
            ${otp}
          </div>
          <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
          <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-size: 12px; color: #888;">
            © 2026 Dairy Society Management System
          </p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({
        success: true,
        message: 'OTP sent successfully to your email'
      });
    } catch (mailError) {
      console.error('SMTP Error (Email sending failed):', mailError.message);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please check if your App Password in .env is correct.'
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please check if the email credentials in .env are correct.'
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
        lastName: user.lastName,
        location: user.location,
        address: user.address,
        totalMilkRecords: user.totalMilkRecords,
        offersSubscription: user.offersSubscription,
        subscriptionMilkRate: user.subscriptionMilkRate,
        subscriptionDeliveryRange: user.subscriptionDeliveryRange,
        offersPreBooking: user.offersPreBooking,
        preBookingMilkRate: user.preBookingMilkRate,
        preBookingDeliveryRange: user.preBookingDeliveryRange
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
        lastName: user.lastName,
        location: user.location,
        address: user.address,
        totalMilkRecords: user.totalMilkRecords,
        offersSubscription: user.offersSubscription,
        subscriptionMilkRate: user.subscriptionMilkRate,
        subscriptionDeliveryRange: user.subscriptionDeliveryRange,
        offersPreBooking: user.offersPreBooking,
        preBookingMilkRate: user.preBookingMilkRate,
        preBookingDeliveryRange: user.preBookingDeliveryRange
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
