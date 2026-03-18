const mongoose = require('mongoose');
const Farmer = require('./models/Farmer');
require('dotenv').config();

const findArchaDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const farmers = await Farmer.find({ firstName: /Archa/i });
        console.log(`Found ${farmers.length} farmers named Archa:`);
        farmers.forEach((f, i) => {
            console.log(`${i+1}. ID: ${f._id}, Username: ${f.username}, AvgRating: ${f.avgRating}, TotalReviews: ${f.totalReviews}, TotalMilkRecords: ${f.totalMilkRecords}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

findArchaDuplicates();
