const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const FarmerAvailability = require('./backend/models/FarmerAvailability');
const Farmer = require('./backend/models/User'); // In this project, User with role 'farmer' is used

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const archa = await Farmer.findOne({ firstName: /Archa/i });
        if (!archa) {
            console.log('Farmer Archa not found');
            return;
        }
        console.log(`Found Archa: ${archa._id} (${archa.firstName} ${archa.lastName})`);

        const records = await FarmerAvailability.find({ farmer: archa._id }).sort({ date: -1, updatedAt: -1 });
        console.log(`Commonly found ${records.length} records for Archa`);

        for (const rec of records) {
            console.log(`RecordID: ${rec._id}, Date: ${rec.date.toISOString()}, Qty: ${rec.availableQuantity}, UpdatedAt: ${rec.updatedAt.toISOString()}`);
        }

        if (records.length > 1) {
            // Keep the most recent one (sorted by updatedAt)
            const keepId = records[0]._id;
            const deleteResult = await FarmerAvailability.deleteMany({
                farmer: archa._id,
                _id: { $ne: keepId }
            });
            console.log(`Deleted ${deleteResult.deletedCount} duplicate/old records for Archa. Kept record: ${keepId}`);
        } else {
            console.log('No duplicates found in DB for Archa.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

cleanup();
