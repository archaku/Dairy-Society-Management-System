const express = require('express');
const router = express.Router();
const FarmerAvailability = require('../models/FarmerAvailability');
const DirectMilkSale = require('../models/DirectMilkSale');
const Farmer = require('../models/Farmer');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify farmer
const verifyFarmer = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'farmer') {
            return res.status(403).json({ success: false, message: 'Access denied. Farmers only.' });
        }
        req.farmerId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Middleware to verify user
const verifyUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'user') {
            return res.status(403).json({ success: false, message: 'Access denied. Users only.' });
        }
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// @route   POST /api/direct-milk/availability
// @desc    Farmer registers milk availability for the day
router.post('/availability', verifyFarmer, async (req, res) => {
    try {
        console.log(`Updating availability for farmer: ${req.farmerId}`);
        const { availableQuantity, pricePerLiter } = req.body;
        console.log('Request body:', req.body);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        today.setMilliseconds(0);

        let availability = await FarmerAvailability.findOne({
            farmer: req.farmerId,
            date: today
        });

        if (availability) {
            console.log('Updating existing availability record');
            availability.availableQuantity = availableQuantity;
            availability.pricePerLiter = pricePerLiter;
            await availability.save();
        } else {
            console.log('Creating new availability record for today');
            availability = new FarmerAvailability({
                farmer: req.farmerId,
                availableQuantity,
                pricePerLiter,
                date: today
            });
            await availability.save();
        }

        res.json({ success: true, availability });
    } catch (error) {
        console.error('Error in /availability:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/direct-milk/farmers
// @desc    List farmers who have registered availability for today
router.get('/farmers', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let availabilities = await FarmerAvailability.find({
            date: { $gte: today },
            availableQuantity: { $gt: 0 }
        }).populate('farmer', 'firstName lastName username phone address avgRating totalReviews avgQualityScore');

        // Filter out any availabilities where the farmer no longer exists
        availabilities = availabilities.filter(avail => avail.farmer !== null);

        res.json({ success: true, availabilities });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/direct-milk/request
// @desc    User initiates a purchase request
router.post('/request', verifyUser, async (req, res) => {
    try {
        const { farmerId, quantity } = req.body;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const availability = await FarmerAvailability.findOne({
            farmer: farmerId,
            date: { $gte: today }
        });

        if (!availability || availability.availableQuantity < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient milk available from this farmer today.'
            });
        }

        const totalAmount = quantity * availability.pricePerLiter;

        console.log(`Creating sale record for user: ${req.userId}, farmer: ${farmerId}`);
        const newSale = new DirectMilkSale({
            user: req.userId,
            farmer: farmerId,
            quantity,
            pricePerLiter: availability.pricePerLiter,
            totalAmount,
            status: 'pending',
            paymentStatus: req.body.paymentId ? 'Completed' : 'pending',
            paymentId: req.body.paymentId
        });

        await newSale.save();
        console.log('✅ Direct milk request created in DB:', newSale._id);
        res.status(201).json({ success: true, sale: newSale });
    } catch (error) {
        console.error('❌ CRITICAL Error in /request:', error);
        res.status(500).json({ success: false, message: "Internal DB Error: " + error.message });
    }
});

// @route   GET /api/direct-milk/user/requests
// @desc    User views their requests
router.get('/user/requests', verifyUser, async (req, res) => {
    try {
        let requests = await DirectMilkSale.find({ user: req.userId })
            .populate('farmer', 'firstName lastName username phone')
            .sort({ createdAt: -1 });

        // Filter out any requests where the farmer no longer exists
        requests = requests.filter(req => req.farmer !== null);

        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/direct-milk/farmer/requests
// @desc    Farmer views requests received from users
router.get('/farmer/requests', verifyFarmer, async (req, res) => {
    try {
        let requests = await DirectMilkSale.find({ farmer: req.farmerId })
            .populate('user', 'firstName lastName username phone address')
            .sort({ createdAt: -1 });

        // Filter out any requests where the user no longer exists
        requests = requests.filter(req => req.user !== null);

        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/direct-milk/farmer/action/:id
// @desc    Farmer approves or rejects a request
router.put('/farmer/action/:id', verifyFarmer, async (req, res) => {
    try {
        const { action, remark } = req.body; // action: 'approved', 'rejected', 'delivered'

        const sale = await DirectMilkSale.findById(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: 'Request not found' });

        if (sale.farmer.toString() !== req.farmerId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        if (action === 'approved') {
            // Deduct from availability
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const availability = await FarmerAvailability.findOne({
                farmer: sale.farmer,
                date: { $gte: today }
            });

            if (availability) {
                if (availability.availableQuantity < sale.quantity) {
                    return res.status(400).json({ success: false, message: 'Insufficient availability to approve.' });
                }
                availability.availableQuantity -= sale.quantity;
                await availability.save();
            }
        }

        sale.status = action;
        if (remark) sale.remark = remark;
        await sale.save();

        res.json({ success: true, sale });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/direct-milk/user/feedback/:id
// @desc    User adds feedback/rating after a successful sale
router.put('/user/feedback/:id', verifyUser, async (req, res) => {
    try {
        const { feedback, rating } = req.body;

        const sale = await DirectMilkSale.findById(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

        if (sale.user.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        if (sale.status !== 'delivered' && sale.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Feedback can only be given for approved or delivered orders.' });
        }

        sale.feedback = feedback;
        sale.rating = rating;
        await sale.save();

        // Recalculate Farmer Stats
        const allFarmerSales = await DirectMilkSale.find({
            farmer: sale.farmer,
            rating: { $exists: true }
        });

        const totalReviews = allFarmerSales.length;
        const avgRating = allFarmerSales.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews;

        await Farmer.findByIdAndUpdate(sale.farmer, {
            avgRating: parseFloat(avgRating.toFixed(1)),
            totalReviews
        });

        res.json({ success: true, sale });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/direct-milk/farmer/:farmerId/reviews
// @desc    Get all reviews/feedback for a specific farmer
router.get('/farmer/:farmerId/reviews', async (req, res) => {
    try {
        const reviews = await DirectMilkSale.find({
            farmer: req.params.farmerId,
            rating: { $exists: true }
        })
            .populate('user', 'firstName lastName')
            .select('rating feedback user createdAt')
            .sort({ createdAt: -1 });

        res.json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
