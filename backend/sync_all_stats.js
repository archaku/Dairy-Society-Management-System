const mongoose = require('mongoose');
const Farmer = require('./models/Farmer');
const MilkRecord = require('./models/MilkRecord');
const DirectMilkSale = require('./models/DirectMilkSale');
require('dotenv').config();

const syncAllFarmerStats = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const farmers = await Farmer.find({});
        console.log(`Found ${farmers.length} farmers to sync.`);

        for (const farmer of farmers) {
            console.log(`Syncing stats for ${farmer.username}...`);

            // 1. Sync Milk Records (Deliveries)
            const milkRecordsCount = await MilkRecord.countDocuments({ farmer: farmer._id });
            
            // 2. Sync Reviews & Ratings (from DirectMilkSale)
            const salesWithRatings = await DirectMilkSale.find({
                farmer: farmer._id,
                rating: { $exists: true }
            });

            const totalReviews = salesWithRatings.length;
            let avgRating = 0;
            if (totalReviews > 0) {
                const sum = salesWithRatings.reduce((acc, sale) => acc + (sale.rating || 0), 0);
                avgRating = parseFloat((sum / totalReviews).toFixed(1));
            }

            // 3. Update Farmer
            farmer.totalMilkRecords = milkRecordsCount;
            farmer.totalReviews = totalReviews;
            farmer.avgRating = avgRating;

            await farmer.save();
            console.log(`✅ Updated ${farmer.username}: Deliveries=${milkRecordsCount}, Reviews=${totalReviews}, Rating=${avgRating}`);
        }

        console.log('Sync completed successfully.');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Sync failed:', err);
    }
};

syncAllFarmerStats();
