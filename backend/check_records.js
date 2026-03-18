const mongoose = require('mongoose');
require('dotenv').config();

require('./models/Farmer');
const MilkRecord = require('./models/MilkRecord');
const SocietyInventory = require('./models/SocietyInventory');

async function checkRecentRecords() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to dsms');

        const records = await MilkRecord.find().sort({ createdAt: -1 }).limit(5);
        console.log(`Recent milk records (${records.length}):`);
        records.forEach((r, i) => {
            console.log(`${i + 1}. Qty: ${r.quantity}L, Farmer: ${r.farmer}, Date: ${r.createdAt}`);
        });

        const inventory = await SocietyInventory.findOne();
        console.log('Current Inventory:', inventory);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkRecentRecords();
