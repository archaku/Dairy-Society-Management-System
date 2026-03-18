const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const FarmerAvailability = require('./models/FarmerAvailability');
const Farmer = require('./models/Farmer');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const archa = await Farmer.findOne({ firstName: /Archa/i });
        if (!archa) return console.log('Archa not found');
        
        const records = await FarmerAvailability.find({ 
            farmer: archa._id
        }).sort({ updatedAt: -1 });
        
        console.log(`--- Records for Archa (${archa._id}) ---`);
        records.forEach(r => {
            console.log(`ID: ${r._id}, Date: ${r.date.toISOString()}, Qty: ${r.availableQuantity}, Updated: ${r.updatedAt.toISOString()}`);
        });

        const today = new Date();
        today.setHours(0,0,0,0);
        console.log(`Today's threshold (local start): ${today.toISOString()}`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
check();
