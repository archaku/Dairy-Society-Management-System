const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Supplement = require('../models/Supplement');
const SupplementPurchase = require('../models/SupplementPurchase');
const Admin = require('../models/Admin');
const Farmer = require('../models/Farmer');
const jwt = require('jsonwebtoken');

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/supplements/');
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

// Middleware to verify farmer
const verifyFarmer = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'farmer') {
            return res.status(403).json({ success: false, message: 'Access denied. Farmers only.' });
        }

        const farmer = await Farmer.findById(decoded.userId);
        if (!farmer || !farmer.isActive) {
            return res.status(401).json({ success: false, message: 'Farmer not found or inactive' });
        }

        req.farmerId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

// @route   GET /api/supplements
// @desc    Get all available supplements (Admins see all)
// @access  Public (or Authenticated)
router.get('/', async (req, res) => {
    try {
        let query = { inStock: true };

        // If an admin requests, show all supplements including out of stock
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded.role === 'admin') {
                    query = {};
                }
            } catch (err) {
                // Ignore token errors for public access
            }
        }

        const supplements = await Supplement.find(query);
        res.json({ success: true, supplements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/supplements
// @desc    Add a new supplement (Admin only)
router.post('/', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, category, unit, pricePerUnit, description, targetBenefit } = req.body;
        const supplement = new Supplement({
            name,
            category,
            unit,
            pricePerUnit: parseFloat(pricePerUnit),
            description,
            targetBenefit: targetBenefit || 'general_health',
            image: req.file ? `/uploads/supplements/${req.file.filename}` : null
        });
        await supplement.save();
        res.status(201).json({ success: true, supplement });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/supplements/:id
// @desc    Update supplement (Admin only)
router.put('/:id', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, category, unit, pricePerUnit, description, inStock, targetBenefit } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (category) updateData.category = category;
        if (unit) updateData.unit = unit;
        if (pricePerUnit !== undefined) updateData.pricePerUnit = parseFloat(pricePerUnit);
        if (description) updateData.description = description;
        if (targetBenefit) updateData.targetBenefit = targetBenefit;
        if (inStock !== undefined) updateData.inStock = inStock === 'true' || inStock === true;

        if (req.file) {
            updateData.image = `/uploads/supplements/${req.file.filename}`;
        }

        const supplement = await Supplement.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!supplement) return res.status(404).json({ success: false, message: 'Supplement not found' });

        res.json({ success: true, supplement });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/supplements/:id/toggle-stock
// @desc    Toggle supplement stock status (Admin only)
router.put('/:id/toggle-stock', verifyAdmin, async (req, res) => {
    try {
        const { inStock } = req.body;
        const supplement = await Supplement.findByIdAndUpdate(req.params.id, { inStock }, { new: true });
        if (!supplement) return res.status(404).json({ success: false, message: 'Supplement not found' });
        res.json({ success: true, supplement });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   DELETE /api/supplements/:id
// @desc    Delete supplement (Admin only)
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const supplement = await Supplement.findByIdAndDelete(req.params.id);
        if (!supplement) return res.status(404).json({ success: false, message: 'Supplement not found' });
        res.json({ success: true, message: 'Supplement deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/supplements/purchase
// @desc    Purchase supplements (Farmer only)
router.post('/purchase', verifyFarmer, async (req, res) => {
    try {
        const { items } = req.body; // Array of { supplementId, quantity }
        let totalAmount = 0;
        const purchaseItems = [];

        for (const item of items) {
            const supplement = await Supplement.findById(item.supplementId);
            if (!supplement || !supplement.inStock) {
                return res.status(400).json({ success: false, message: `Item ${item.supplementId} not available` });
            }
            const itemTotal = supplement.pricePerUnit * item.quantity;
            totalAmount += itemTotal;
            purchaseItems.push({
                supplement: supplement._id,
                quantity: item.quantity,
                priceAtTime: supplement.pricePerUnit
            });
        }

        const purchase = new SupplementPurchase({
            farmer: req.farmerId,
            items: purchaseItems,
            totalAmount,
            paymentStatus: req.body.paymentId ? 'Completed' : 'pending',
            paymentId: req.body.paymentId
        });

        await purchase.save();
        res.status(201).json({ success: true, message: 'Order placed successfully', purchase });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/supplements/orders
// @desc    Get all orders (Admin views all, Farmer views own)
router.get('/orders', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        let query = {};
        if (decoded.role === 'farmer') {
            query = { farmer: decoded.userId };
        } else if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const orders = await SupplementPurchase.find(query)
            .populate('farmer', 'firstName lastName username')
            .populate('items.supplement', 'name category unit')
            .sort({ createdAt: -1 });

        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/supplements/orders/:id
// @desc    Update order status (Admin only)
router.put('/orders/:id', verifyAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await SupplementPurchase.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
