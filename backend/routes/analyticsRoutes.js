const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MilkRecord = require('../models/MilkRecord');
const Farmer = require('../models/Farmer');
const OrganizationSale = require('../models/OrganizationSale');
const jwt = require('jsonwebtoken');

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

// @route   GET /api/analytics/admin
// @desc    Get admin analytics data (collection trends, leaderboard)
router.get('/admin', verifyAdmin, async (req, res) => {
    try {
        // 1. Milk Collection Trends (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const collectionTrends = await MilkRecord.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalQuantity: { $sum: "$quantity" },
                    avgQuality: { $avg: "$qualityScore" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // 2. Farmer Leaderboard (Top 5 by average rating)
        const leaderboard = await Farmer.find({ isActive: true })
            .sort({ avgRating: -1 })
            .limit(5)
            .select('firstName lastName username avgRating totalReviews totalMilkRecords');

        // 3. Society Overview Stats
        const totalFarmers = await Farmer.countDocuments({ isActive: true });
        
        res.json({
            success: true,
            trends: collectionTrends,
            leaderboard,
            stats: {
                totalFarmers
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/analytics/farmer
// @desc    Get farmer individual analytics
router.get('/farmer', verifyFarmer, async (req, res) => {
    try {
        // 1. Monthly Income (Last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const incomeTracker = await MilkRecord.aggregate([
            {
                $match: {
                    farmer: new mongoose.Types.ObjectId(req.farmerId),
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    earnings: { $sum: "$totalAmount" },
                    quantity: { $sum: "$quantity" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // 2. Quality Benchmark (Individual avg vs Society avg)
        const farmer = await Farmer.findById(req.farmerId);
        const societyAvg = await Farmer.aggregate([
            { $match: { totalMilkRecords: { $gt: 0 } } },
            { $group: { _id: null, avg: { $avg: "$avgQualityScore" } } }
        ]);

        const benchmark = {
            farmerAvg: farmer.avgQualityScore || 0,
            societyAvg: societyAvg[0]?.avg || 0,
            isAboveAverage: (farmer.avgQualityScore || 0) > (societyAvg[0]?.avg || 0)
        };

        res.json({
            success: true,
            income: incomeTracker,
            benchmark,
            rating: {
                average: farmer.avgRating || 0,
                count: farmer.totalReviews || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
