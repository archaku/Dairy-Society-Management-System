const express = require('express');
const router = express.Router();
const OrganizationSale = require('../models/OrganizationSale');
const SocietyInventory = require('../models/SocietyInventory');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { getAvailableMilkForShift } = require('../utils/inventory');

// Middleware to verify admin
const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// @route   GET /api/society/inventory
// @desc    Get dynamic society milk inventory splits
router.get('/inventory', verifyAdmin, async (req, res) => {
    try {
        const morningAvailable = await getAvailableMilkForShift('Morning');
        const eveningAvailable = await getAvailableMilkForShift('Evening');
        
        res.json({ success: true, inventory: { totalStock: morningAvailable + eveningAvailable, morningAvailable, eveningAvailable } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/society/sale
// @desc    Record a sale to an organization (e.g. Milma, School)
router.post('/sale', verifyAdmin, async (req, res) => {
    try {
        const { organizationName, quantity, pricePerLiter, shift } = req.body;

        if (!shift) {
            return res.status(400).json({ success: false, message: 'Shift is required' });
        }

        const available = await getAvailableMilkForShift(shift);
        if (available < quantity) {
            return res.status(400).json({ success: false, message: `Insufficient stock. Only ${available.toFixed(2)}L available in ${shift} shift today.` });
        }

        const totalAmount = parseFloat(quantity) * parseFloat(pricePerLiter);

        const sale = new OrganizationSale({
            organizationName,
            quantity: parseFloat(quantity),
            pricePerLiter: parseFloat(pricePerLiter),
            totalAmount,
            shift
        });

        await sale.save();

        res.status(201).json({ success: true, sale });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/society/history
// @desc    Get sale history for organizations
router.get('/history', verifyAdmin, async (req, res) => {
    try {
        const history = await OrganizationSale.find().sort({ date: -1 });
        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
