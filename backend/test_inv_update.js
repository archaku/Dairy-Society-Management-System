const mongoose = require('mongoose');
require('dotenv').config();

const SocietyInventory = require('./models/SocietyInventory');
const MilkRecord = require('./models/MilkRecord');

async function testCollectionUpdate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to dsms');

        const initialInv = await SocietyInventory.findOne();
        console.log('Initial Stock:', initialInv ? initialInv.totalStock : 'NULL');

        const quantity = 5.0;

        // Simulating the logic from milkRoutes.js
        let inventory = await SocietyInventory.findOne();
        if (!inventory) {
            inventory = new SocietyInventory({ totalStock: 0 });
        }
        inventory.totalStock += parseFloat(quantity);
        inventory.lastUpdated = new Date();
        await inventory.save();
        console.log(`Added ${quantity}L. New Stock: ${inventory.totalStock}`);

        const finalInv = await SocietyInventory.findOne();
        console.log('Final Stock Checked:', finalInv.totalStock);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

testCollectionUpdate();
