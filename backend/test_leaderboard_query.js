const mongoose = require('mongoose');
const Farmer = require('./models/Farmer');
require('dotenv').config();

const testAPI = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const leaderboard = await Farmer.find({ isActive: true })
            .sort({ avgRating: -1 })
            .limit(5)
            .select('firstName lastName username avgRating totalReviews totalMilkRecords');
            
        console.log('Leaderboard from DB (using same query as API):');
        console.log(JSON.stringify(leaderboard, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

testAPI();
