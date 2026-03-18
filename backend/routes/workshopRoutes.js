const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Workshop = require('../models/Workshop');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const jwt = require('jsonwebtoken');

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/workshops/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Middleware to verify admin
const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

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

// Middleware to verify any authenticated user (User or Farmer)
const verifyAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { userId, role }
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

// @route   GET /api/workshops
// @desc    Get all active workshops (endDate >= today)
// @access  Authenticated
router.get('/', verifyAuth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const workshops = await Workshop.find({
            endDate: { $gte: today }
        }).sort({ date: 1 });

        res.json({ success: true, workshops });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/workshops
// @desc    Create a workshop (Admin only)
// @access  Admin
router.post('/', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const { title, description, date, endDate, location, totalSlots } = req.body;

        // Basic validation
        if (new Date(endDate) < new Date(date)) {
            return res.status(400).json({ success: false, message: 'End date cannot be before workshop date' });
        }

        const workshop = new Workshop({
            title,
            description,
            date,
            endDate,
            location,
            totalSlots: parseInt(totalSlots),
            image: req.file ? `/uploads/workshops/${req.file.filename}` : null,
            createdBy: req.adminId
        });

        await workshop.save();
        res.status(201).json({ success: true, workshop });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/workshops/book/:id
// @desc    Book a workshop slot
// @access  Authenticated (User or Farmer)
router.post('/book/:id', verifyAuth, async (req, res) => {
    try {
        const workshop = await Workshop.findById(req.params.id);
        if (!workshop) {
            return res.status(404).json({ success: false, message: 'Workshop not found' });
        }

        // Check if seats available
        if (workshop.bookedBy.length >= workshop.totalSlots) {
            return res.status(400).json({ success: false, message: 'No slots available' });
        }

        // Check if already booked
        const alreadyBooked = workshop.bookedBy.some(
            b => b.userId.toString() === req.user.userId && b.userModel.toLowerCase() === req.user.role.toLowerCase()
        );

        if (alreadyBooked) {
            return res.status(400).json({ success: false, message: 'You have already booked this workshop' });
        }

        // Add booking
        workshop.bookedBy.push({
            userId: req.user.userId,
            userModel: req.user.role === 'admin' ? 'Admin' : (req.user.role === 'farmer' ? 'Farmer' : 'User')
        });

        await workshop.save();
        res.json({ success: true, message: 'Booking successful', workshop });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   DELETE /api/workshops/:id
// @desc    Delete a workshop (Admin only)
// @access  Admin
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const workshop = await Workshop.findByIdAndDelete(req.params.id);
        if (!workshop) {
            return res.status(404).json({ success: false, message: 'Workshop not found' });
        }
        res.json({ success: true, message: 'Workshop deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
