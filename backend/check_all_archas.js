const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const FarmerAvailability = require('./models/FarmerAvailability');
const Farmer = require('./models/Farmer');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const farmers = await Farmer.find({ firstName: /Archa/i });
        console.log(`Found ${farmers.length} farmers named Archa`);
        
        for (const f of farmers) {
            console.log(`Farmer: ${f._id}, Name: ${f.firstName} ${f.lastName}, Username: ${f.username}`);
            const records = await FarmerAvailability.find({ farmer: f._id }).sort({ updatedAt: -1 });
            console.log(`  Records: ${records.length}`);
            records.forEach(r => {
                console.log(`    Rec: ${r._id}, Date: ${r.date.toISOString()}, Qty: ${r.availableQuantity}, Updated: ${r.updatedAt.toISOString()}`);
            });
        }

        const today = new Date();
        today.setHours(0,0,0,0);
        console.log(`Filtering threshold: ${today.toISOString()} (${today.getTime()})`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
check();
