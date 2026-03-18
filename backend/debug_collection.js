const mongoose = require('mongoose');
require('dotenv').config();

const SocietyInventory = require('./models/SocietyInventory');
const MilkRecord = require('./models/MilkRecord');

async function debugCollectionProcess() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to dsms');

        const testQuantity = "10.0"; // Simulate string from body

        console.log('Step 1: Finding Inventory...');
        let inventory = await SocietyInventory.findOne();
        if (!inventory) {
            console.log('Inventory not found, creating new...');
            inventory = new SocietyInventory({ totalStock: 0 });
        }
        console.log('Current totalStock:', inventory.totalStock);

        console.log('Step 2: Updating Stock...');
        const initialStock = inventory.totalStock;
        inventory.totalStock += parseFloat(testQuantity);
        inventory.lastUpdated = new Date();

        console.log(`Calculation: ${initialStock} + ${testQuantity} = ${inventory.totalStock}`);

        console.log('Step 3: Saving Inventory...');
        await inventory.save();
        console.log('Inventory saved successfully.');

        const verifyInv = await SocietyInventory.findOne();
        console.log('Verified Stock in DB:', verifyInv.totalStock);

        process.exit(0);
    } catch (error) {
        console.error('Debug Error:', error);
        process.exit(1);
    }
}

debugCollectionProcess();
