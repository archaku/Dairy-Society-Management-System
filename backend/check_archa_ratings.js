const mongoose = require('mongoose');
const Farmer = require('./models/Farmer');
const DirectMilkSale = require('./models/DirectMilkSale');
require('dotenv').config();

const checkArcha = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/DSMS');
        console.log('Connected to DB');

        const archa = await Farmer.findOne({ firstName: /Archa/i });
        if (!archa) {
            console.log('Farmer Archa not found');
            return;
        }

        console.log('Farmer Archa Document:');
        console.log({
            id: archa._id,
            firstName: archa.firstName,
            avgRating: archa.avgRating,
            totalReviews: archa.totalReviews,
            totalMilkRecords: archa.totalMilkRecords
        });

        const ratedSales = await DirectMilkSale.find({
            farmer: archa._id,
            rating: { $exists: true }
        });

        console.log(`\nRated Sales for Archa: ${ratedSales.length}`);
        ratedSales.forEach((sale, i) => {
            console.log(`${i+1}. Rating: ${sale.rating}, Feedback: ${sale.feedback}`);
        });

        if (ratedSales.length > 0) {
            const sum = ratedSales.reduce((acc, curr) => acc + curr.rating, 0);
            const calculatedAvg = sum / ratedSales.length;
            console.log(`\nManual Calculation: Avg = ${calculatedAvg}, Total = ${ratedSales.length}`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkArcha();
