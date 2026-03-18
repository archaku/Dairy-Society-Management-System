const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const FarmerAvailability = require('./models/FarmerAvailability');
const Farmer = require('./models/Farmer');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const farmers = await Farmer.find({});
        console.log(`Found ${farmers.length} farmers total`);
        
        const today = new Date();
        today.setHours(0,0,0,0);
        console.log(`Threshold: ${today.toISOString()}`);

        const avails = await FarmerAvailability.find({
            date: { $gte: today }
        }).populate('farmer');

        console.log(`Found ${avails.length} active availabilities today:`);
        avails.forEach(a => {
            console.log(`- Farmer: ${a.farmer?.firstName} ${a.farmer?.lastName} (${a.farmer?._id}), Username: ${a.farmer?.username}`);
            console.log(`  AvailID: ${a._id}, Qty: ${a.availableQuantity}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
check();
