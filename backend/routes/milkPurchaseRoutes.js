const express = require('express');
const router = express.Router();
const MilkPurchase = require('../models/MilkPurchase');
const MilkRecord = require('../models/MilkRecord');
const jwt = require('jsonwebtoken');

// Middleware to verify user (regular user)
const verifyUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // User role should be 'user' (default for regular customers)
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Middleware to verify admin
const Admin = require('../models/Admin');
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

        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

// @route   GET /api/purchase/available
// @desc    Get available milk for today and average price
router.get('/available', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Sum up all milk collected today
        const records = await MilkRecord.find({
            date: { $gte: today, $lt: tomorrow }
        });
        const totalCollected = records.reduce((sum, rec) => sum + rec.quantity, 0);

        // Calculate average rate for today
        let avgRate = 50; // Default if no records
        if (records.length > 0) {
            const sumRates = records.reduce((sum, rec) => sum + rec.pricePerLiter, 0);
            avgRate = parseFloat((sumRates / records.length).toFixed(2));
        }

        // Sum up all milk purchased today
        const purchases = await MilkPurchase.find({
            date: { $gte: today, $lt: tomorrow },
            status: { $ne: 'cancelled' }
        });
        const totalPurchased = purchases.reduce((sum, pur) => sum + pur.quantity, 0);

        const available = Math.max(0, totalCollected - totalPurchased);

        res.json({
            success: true,
            available,
            rate: avgRate,
            deliveryCharge: 10
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/purchase
// @desc    Purchase milk
router.post('/', verifyUser, async (req, res) => {
    try {
        const { quantity, deliveryType } = req.body;
        if (!quantity || quantity <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid quantity' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Check availability
        const records = await MilkRecord.find({
            date: { $gte: today, $lt: tomorrow }
        });
        const totalCollected = records.reduce((sum, rec) => sum + rec.quantity, 0);

        // Calculate average rate for today
        let avgRate = 50;
        if (records.length > 0) {
            const sumRates = records.reduce((sum, rec) => sum + rec.pricePerLiter, 0);
            avgRate = parseFloat((sumRates / records.length).toFixed(2));
        }

        const purchases = await MilkPurchase.find({
            date: { $gte: today, $lt: tomorrow },
            status: { $ne: 'cancelled' }
        });
        const totalPurchased = purchases.reduce((sum, pur) => sum + pur.quantity, 0);

        const available = totalCollected - totalPurchased;

        if (quantity > available) {
            return res.status(400).json({
                success: false,
                message: `Only ${available.toFixed(2)}L available. Please adjust your quantity.`
            });
        }

        const deliveryCharge = deliveryType === 'Takeaway' ? 0 : 10;
        const totalAmount = (quantity * avgRate) + deliveryCharge;

        const newPurchase = new MilkPurchase({
            user: req.userId,
            quantity,
            rate: avgRate,
            deliveryCharge,
            deliveryType: deliveryType || 'COD',
            totalAmount
        });

        await newPurchase.save();
        res.status(201).json({ success: true, purchase: newPurchase });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/purchase/admin/all
// @desc    Get all purchases for admin
router.get('/admin/all', verifyAdmin, async (req, res) => {
    try {
        const purchases = await MilkPurchase.find()
            .populate('user', 'firstName lastName username phone')
            .sort({ date: -1 });
        res.json({ success: true, purchases });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/purchase/admin/approve/:id
// @desc    Approve/Deliver a milk purchase
router.put('/admin/approve/:id', verifyAdmin, async (req, res) => {
    try {
        const purchase = await MilkPurchase.findByIdAndUpdate(
            req.params.id,
            { status: 'delivered' },
            { new: true }
        );
        res.json({ success: true, purchase });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/purchase/admin/cancel/:id
// @desc    Cancel a milk purchase
router.put('/admin/cancel/:id', verifyAdmin, async (req, res) => {
    try {
        const purchase = await MilkPurchase.findByIdAndUpdate(
            req.params.id,
            { status: 'cancelled' },
            { new: true }
        );
        res.json({ success: true, purchase });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/purchase/user
// @desc    Get purchase history for logged in user
router.get('/user', verifyUser, async (req, res) => {
    try {
        const purchases = await MilkPurchase.find({ user: req.userId }).sort({ date: -1 });
        res.json({ success: true, purchases });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
