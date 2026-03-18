const mongoose = require('mongoose');
const Farmer = require('./models/Farmer');
const DirectMilkSale = require('./models/DirectMilkSale');
require('dotenv').config();

const syncRatings = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const farmers = await Farmer.find({});
        console.log(`Found ${farmers.length} farmers. Starting sync...`);

        for (const farmer of farmers) {
            const allFarmerSales = await DirectMilkSale.find({
                farmer: farmer._id,
                rating: { $exists: true }
            });

            if (allFarmerSales.length > 0) {
                const totalReviews = allFarmerSales.length;
                const avgRating = allFarmerSales.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews;
                
                await Farmer.findByIdAndUpdate(farmer._id, {
                    avgRating: parseFloat(avgRating.toFixed(1)),
                    totalReviews: totalReviews
                });

                console.log(`Updated Farmer ${farmer.firstName} ${farmer.lastName}: Avg ${avgRating.toFixed(1)}, Total ${totalReviews}`);
            } else {
                console.log(`Farmer ${farmer.firstName} ${farmer.lastName} has no rated sales.`);
                // Reset to 0 if no rated sales found
                 await Farmer.findByIdAndUpdate(farmer._id, {
                    avgRating: 0,
                    totalReviews: 0
                });
            }
        }

        console.log('Sync completed.');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Sync failed:', err);
    }
};

syncRatings();
