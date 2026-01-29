const express = require('express');
const router = express.Router();
const MilkRecord = require('../models/MilkRecord');
const Farmer = require('../models/Farmer');
const jwt = require('jsonwebtoken');

// Middleware to verify if user is a farmer
const verifyFarmer = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('verifyFarmer - Decoded role:', decoded.role);

        if (decoded.role !== 'farmer') {
            return res.status(403).json({ success: false, message: `Access denied. Farmers only. Your role: ${decoded.role}` });
        }
        req.farmerId = decoded.userId;
        next();
    } catch (error) {
        console.error('verifyFarmer Error:', error.message);
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Middleware to verify admin
const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('verifyAdmin - Decoded role:', decoded.role);

        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: `Access denied. Admin only. Your role: ${decoded.role}` });
        }
        next();
    } catch (error) {
        console.error('verifyAdmin Error:', error.message);
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Helper function for normalization
const normalize = (val, min, max) => {
    const v = parseFloat(val);
    if (v <= min) return 0;
    if (v >= max) return 1;
    return (v - min) / (max - min);
};

// @route   POST /api/milk/record
// @desc    Submit a new milk delivery (Admin only)
router.post('/record', verifyAdmin, async (req, res) => {
    console.log('POST /api/milk/record - Request received');
    try {
        const { farmerId, quantity, fat, snf, lactose, protein, ph } = req.body;

        if (!farmerId) {
            return res.status(400).json({ success: false, message: 'Farmer ID is required' });
        }

        // Normalization Ranges
        const fs = normalize(fat, 3.0, 10.0);
        const snfs = normalize(snf, 8.0, 10.5);
        const ls = normalize(lactose, 4.0, 5.0);
        const ps = normalize(protein, 3.0, 4.5);
        const phs = normalize(ph, 6.6, 6.8);

        // Q Calculation
        const Q = (0.30 * fs) + (0.25 * snfs) + (0.15 * ls) + (0.20 * ps) + (0.10 * phs);

        // Price Calculation
        const pricePerLiter = 40 + (Q * 10);
        const totalAmount = parseFloat(quantity) * pricePerLiter;

        const newRecord = new MilkRecord({
            farmer: farmerId,
            quantity: parseFloat(quantity),
            fat: parseFloat(fat),
            snf: parseFloat(snf),
            lactose: parseFloat(lactose),
            protein: parseFloat(protein),
            ph: parseFloat(ph),
            qualityScore: Q,
            pricePerLiter,
            totalAmount
        });

        await newRecord.save();
        console.log('Milk record saved successfully');
        res.status(201).json({ success: true, record: newRecord });
    } catch (error) {
        console.error('POST /api/milk Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/milk/farmer
// @desc    Get milk history for current farmer
router.get('/farmer', verifyFarmer, async (req, res) => {
    try {
        const records = await MilkRecord.find({ farmer: req.farmerId }).sort({ date: -1 });
        res.json({ success: true, records });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/milk/admin/all
// @desc    Get all milk records for admin
router.get('/admin/all', verifyAdmin, async (req, res) => {
    try {
        const records = await MilkRecord.find().populate('farmer', 'firstName lastName username').sort({ date: -1 });
        res.json({ success: true, records });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/milk/admin/pay/:id
// @desc    Update payment status
router.put('/admin/pay/:id', verifyAdmin, async (req, res) => {
    try {
        const record = await MilkRecord.findByIdAndUpdate(req.params.id, { status: 'paid' }, { new: true });
        res.json({ success: true, record });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
