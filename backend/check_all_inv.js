const mongoose = require('mongoose');
require('dotenv').config();

const SocietyInventory = require('./models/SocietyInventory');

async function checkAllInventories() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to dsms');

        const inventories = await SocietyInventory.find();
        console.log(`Total inventory documents: ${inventories.length}`);
        inventories.forEach((inv, i) => {
            console.log(`${i + 1}. ID: ${inv._id}, stock: ${inv.totalStock}, lastUpdated: ${inv.lastUpdated}`);
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkAllInventories();
