const express = require('express');
const router = express.Router();
const MilkPurchase = require('../models/MilkPurchase');
const MilkRecord = require('../models/MilkRecord');
const SocietyInventory = require('../models/SocietyInventory');
const jwt = require('jsonwebtoken');
const { getAvailableMilkForShift } = require('../utils/inventory');

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
        const morningAvailable = await getAvailableMilkForShift('Morning');
        const eveningAvailable = await getAvailableMilkForShift('Evening');

        // Calculate average rate from today's collections
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const milkRecords = await MilkRecord.find({ createdAt: { $gte: today } });
        const totalAmt = milkRecords.reduce((sum, rec) => sum + (rec.totalAmount || 0), 0);
        const totalQty = milkRecords.reduce((sum, rec) => sum + (rec.quantity || 0), 0);
        const avgRate = totalQty > 0 ? (totalAmt / totalQty) : 45;

        res.json({
            success: true,
            morningAvailable,
            eveningAvailable,
            rate: Math.round(avgRate * 100) / 100,
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
        const { quantity, deliveryType, distance, shift } = req.body;
        if (!quantity || quantity <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid quantity' });
        }
        if (!shift) {
            return res.status(400).json({ success: false, message: 'Shift is required' });
        }

        // Calculate current average rate
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const milkRecords = await MilkRecord.find({ createdAt: { $gte: today } });
        const totalAmt = milkRecords.reduce((sum, rec) => sum + (rec.totalAmount || 0), 0);
        const totalQty = milkRecords.reduce((sum, rec) => sum + (rec.quantity || 0), 0);
        const avgRate = totalQty > 0 ? (totalAmt / totalQty) : 45;

        // Check availability strictly for the requested shift today
        const available = await getAvailableMilkForShift(shift);
        if (available < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${available.toFixed(2)}L available in ${shift} shift today. Please adjust your quantity.`
            });
        }

        const deliveryCharge = deliveryType === 'Takeaway' ? 0 : (distance ? (distance * 10) : 10);
        const totalAmount = (quantity * avgRate) + deliveryCharge;

        const newPurchase = new MilkPurchase({
            user: req.userId,
            quantity,
            rate: avgRate,
            deliveryCharge,
            distance: distance || 0,
            deliveryType: deliveryType || 'COD',
            totalAmount,
            status: 'pending',
            paymentStatus: req.body.paymentId ? 'Completed' : 'pending',
            paymentId: req.body.paymentId,
            shift
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
        let purchases = await MilkPurchase.find()
            .populate('user', 'firstName lastName username phone')
            .sort({ date: -1 });

        // Filter out orphans
        purchases = purchases.filter(p => p.user !== null);

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
        const purchase = await MilkPurchase.findById(req.params.id);
        if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });

        if (purchase.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Purchase is already cancelled' });
        }

        const oldStatus = purchase.status;
        purchase.status = 'cancelled';
        await purchase.save();

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
