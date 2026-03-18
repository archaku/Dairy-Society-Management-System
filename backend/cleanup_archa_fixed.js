const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const FarmerAvailability = require('./models/FarmerAvailability');
const Farmer = require('./models/Farmer');

async function cleanup() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI is not defined in .env');
            return;
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const archa = await Farmer.findOne({ firstName: /Archa/i });
        if (!archa) {
            console.log('Farmer Archa not found');
            return;
        }
        console.log(`Found Archa: ${archa._id} (${archa.firstName} ${archa.lastName})`);

        // Find all records for Archa
        const records = await FarmerAvailability.find({ farmer: archa._id }).sort({ updatedAt: -1 });
        console.log(`Commonly found ${records.length} records for Archa`);

        for (const rec of records) {
             console.log(`RecordID: ${rec._id}, Date: ${rec.date.toISOString()}, Qty: ${rec.availableQuantity}, UpdatedAt: ${rec.updatedAt.toISOString()}`);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        today.setMilliseconds(0);

        const todayRecords = records.filter(r => {
            const rDate = new Date(r.date);
            rDate.setHours(0,0,0,0);
            return rDate.getTime() === today.getTime();
        });
        
        console.log(`Found ${todayRecords.length} records for today's date`);

        if (todayRecords.length > 1) {
            // Keep only the most recent one
            const keepId = todayRecords[0]._id;
            console.log(`Keeping record: ${keepId}`);
            
            const toDelete = todayRecords.slice(1).map(r => r._id);
            const deleteResult = await FarmerAvailability.deleteMany({
                _id: { $in: toDelete }
            });
            console.log(`Deleted ${deleteResult.deletedCount} duplicate records for Archa for today.`);
        } else {
            console.log('No duplicates found in DB for Archa for today.');
            
            // If the user sees 3 boxes, maybe they are from different dates but showing up?
            // User said "3 same boxes", probably same date.
            // Let's check if there are records from "very close" dates or full timestamps.
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

cleanup();
