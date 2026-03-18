const mongoose = require('mongoose');
require('dotenv').config();

const SocietyInventory = require('./models/SocietyInventory');
const OrganizationSale = require('./models/OrganizationSale');
const MilkRecord = require('./models/MilkRecord');

async function checkInventorySystem() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to dsms');

        const inventory = await SocietyInventory.findOne();
        console.log('Current Society Inventory:', inventory);

        const totalCollected = await MilkRecord.aggregate([
            { $group: { _id: null, total: { $sum: "$quantity" } } }
        ]);
        console.log('Total milk collected (all time):', totalCollected[0]?.total || 0);

        const totalOrgSales = await OrganizationSale.aggregate([
            { $group: { _id: null, total: { $sum: "$quantity" } } }
        ]);
        console.log('Total organization sales:', totalOrgSales[0]?.total || 0);

        // Also check if any other schema is decrementing inventory (like User purchases)
        // I'll leave that for now.

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkInventorySystem();
