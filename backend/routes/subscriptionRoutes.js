const express = require('express');
const router = express.Router();
const MilkSubscription = require('../models/MilkSubscription');
const SubscriptionDelivery = require('../models/SubscriptionDelivery');
const Farmer = require('../models/Farmer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Middlewares
const verifyUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'user') return res.status(403).json({ success: false, message: 'User access only' });
        req.userId = decoded.userId;
        next();
    } catch (err) { res.status(401).json({ success: false, message: 'Invalid token' }); }
};

const verifyFarmer = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'farmer') return res.status(403).json({ success: false, message: 'Farmer access only' });
        req.farmerId = decoded.userId;
        next();
    } catch (err) { res.status(401).json({ success: false, message: 'Invalid token' }); }
};

// @route   POST /api/subscriptions
// @desc    Create a new subscription (User)
router.post('/', verifyUser, async (req, res) => {
    try {
        const { 
            farmerId, 
            quantityPerDay, 
            startDate, 
            endDate, 
            shift, 
            distance, 
            deliveryLocation,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature
        } = req.body;

        // Verify Razorpay Payment Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        const farmer = await Farmer.findById(farmerId);
        if (!farmer) return res.status(404).json({ success: false, message: 'Farmer not found' });

        if (!farmer.offersSubscription) {
            return res.status(400).json({ success: false, message: 'This farmer is not currently accepting new subscriptions.' });
        }

        if (distance > farmer.subscriptionDeliveryRange) {
            return res.status(400).json({ success: false, message: `Delivery distance (${distance} km) exceeds the farmer's maximum range of ${farmer.subscriptionDeliveryRange} km.` });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive

        if (days <= 0) return res.status(400).json({ success: false, message: 'Invalid date range' });

        const pricePerLiter = farmer.subscriptionMilkRate || 50;
        const milkTotal = pricePerLiter * quantityPerDay * days;
        const deliveryCharge = distance * 15 * days;
        const totalAmount = milkTotal + deliveryCharge;

        const subscription = new MilkSubscription({
            user: req.userId,
            farmer: farmerId,
            quantityPerDay,
            startDate: start,
            endDate: end,
            shift,
            pricePerLiter,
            deliveryCharge,
            totalAmount,
            distance,
            deliveryLocation,
            paymentStatus: 'Completed',
            paymentId: razorpay_payment_id,
            status: 'active'
        });

        await subscription.save();
        res.status(201).json({ success: true, subscription });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/subscriptions/user
// @desc    Get user's subscriptions
router.get('/user', verifyUser, async (req, res) => {
    try {
        const subscriptions = await MilkSubscription.find({ user: req.userId })
            .populate('farmer', 'firstName lastName phone')
            .sort({ createdAt: -1 });

        // Include delivery logs to show progress
        const results = [];
        for (let sub of subscriptions) {
            const deliveries = await SubscriptionDelivery.find({ subscriptionId: sub._id }).sort({ date: -1 });
            results.push({ ...sub.toObject(), deliveries });
        }

        res.json({ success: true, subscriptions: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/subscriptions/farmer/today
// @desc    Get farmer's expected deliveries for today
router.get('/farmer/today', verifyFarmer, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find active subscriptions where today is between start and end date
        const activeSubs = await MilkSubscription.find({
            farmer: req.farmerId,
            status: 'active',
            startDate: { $lte: new Date(today.getTime() + 86400000 - 1) }, 
            endDate: { $gte: today }
        }).populate('user', 'firstName lastName phone address');

        // Check which ones have delivery logs for today
        const deliveriesToday = await SubscriptionDelivery.find({
            subscriptionId: { $in: activeSubs.map(s => s._id) },
            date: { $gte: today, $lt: new Date(today.getTime() + 86400000) }
        });

        const deliveryMap = {};
        deliveriesToday.forEach(d => {
            deliveryMap[d.subscriptionId.toString()] = d;
        });

        const schedule = activeSubs.map(sub => {
            const log = deliveryMap[sub._id.toString()];
            return {
                subscription: sub,
                deliveryStatus: log ? log.status : 'pending',
                deliveryLogId: log ? log._id : null
            };
        });

        res.json({ success: true, schedule });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/subscriptions/delivery
// @desc    Mark a subscription delivery as completed for today
router.post('/delivery', verifyFarmer, async (req, res) => {
    try {
        const { subscriptionId } = req.body;
        const sub = await MilkSubscription.findOne({ _id: subscriptionId, farmer: req.farmerId });
        if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let delivery = await SubscriptionDelivery.findOne({
            subscriptionId,
            date: { $gte: today, $lt: new Date(today.getTime() + 86400000) }
        });

        if (delivery) {
            if (delivery.status === 'delivered') return res.status(400).json({ success: false, message: 'Already marked as delivered today' });
            delivery.status = 'delivered';
            delivery.deliveredAt = new Date();
        } else {
            delivery = new SubscriptionDelivery({
                subscriptionId,
                date: today,
                shift: sub.shift,
                status: 'delivered',
                deliveredAt: new Date()
            });
        }

        await delivery.save();
        res.json({ success: true, delivery });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/subscriptions/farmer/requests
// @desc    Get farmer's pending subscriptions for approval
router.get('/farmer/requests', verifyFarmer, async (req, res) => {
    try {
        const requests = await MilkSubscription.find({ farmer: req.farmerId, status: 'pending' })
            .populate('user', 'firstName lastName address phone')
            .sort({ createdAt: -1 });
        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/subscriptions/farmer/action
// @desc    Approve or reject a pending subscription
router.post('/farmer/action', verifyFarmer, async (req, res) => {
    try {
        const { subscriptionId, action } = req.body; // action: 'approve' or 'reject'
        const subscription = await MilkSubscription.findOne({ _id: subscriptionId, farmer: req.farmerId });
        
        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Subscription not found' });
        }

        if (action === 'approve') {
            subscription.status = 'active';
        } else if (action === 'reject') {
            subscription.status = 'rejected';
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        await subscription.save();
        res.json({ success: true, message: `Subscription ${action}d successfully`, subscription });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
