const mongoose = require('mongoose');
require('dotenv').config();

require('./models/Farmer');
const MilkRecord = require('./models/MilkRecord');
const SocietyInventory = require('./models/SocietyInventory');

async function debugInventory() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to dsms');

        const totalRecords = await MilkRecord.countDocuments();
        console.log(`Total milk records: ${totalRecords}`);

        const aggregateResult = await MilkRecord.aggregate([
            { $group: { _id: null, total: { $sum: "$quantity" } } }
        ]);
        const totalQty = aggregateResult[0]?.total || 0;
        console.log(`Calculated total quantity: ${totalQty}L`);

        let inventory = await SocietyInventory.findOne();
        console.log(`Initial Inventory: ${inventory ? inventory.totalStock : 'NULL'}`);

        if (!inventory) {
            console.log('Inventory not found. Creating one...');
            inventory = new SocietyInventory({ totalStock: totalQty });
            await inventory.save();
            console.log('Inventory created with total stock.');
        } else {
            console.log('Inventory found. Syncing...');
            inventory.totalStock = totalQty;
            await inventory.save();
            console.log('Inventory synced.');
        }

        const finalInv = await SocietyInventory.findOne();
        console.log(`Final Inventory: ${finalInv.totalStock}L`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

debugInventory();
