const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const FarmerAvailability = require('./models/FarmerAvailability');
const Farmer = require('./models/Farmer');

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const archa = await Farmer.findOne({ firstName: /Archa/i });
        if (!archa) return console.log('Archa not found');

        const records = await FarmerAvailability.find({ farmer: archa._id }).sort({ updatedAt: -1 });
        console.log(`Initial records for Archa: ${records.length}`);

        if (records.length > 1) {
            const keepId = records[0]._id;
            const res = await FarmerAvailability.deleteMany({
                farmer: archa._id,
                _id: { $ne: keepId }
            });
            console.log(`Aggressively deleted ${res.deletedCount} old/duplicate records. Kept: ${keepId}`);
        } else {
            console.log('Only 1 or 0 records found. No action.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
cleanup();
