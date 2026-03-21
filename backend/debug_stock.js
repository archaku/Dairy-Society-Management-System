const mongoose = require('mongoose');
require('dotenv').config();
const DirectMilkSale = require('./models/DirectMilkSale');
const FarmerAvailability = require('./models/FarmerAvailability');
const Farmer = require('./models/Farmer');
const User = require('./models/User');

async function debug() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log('--- Availabilities Calculation ---');
        const avails = await FarmerAvailability.find({ date: { $gte: today } }).populate('farmer');
        for (let avail of avails) {
            const availStart = new Date(avail.date);
            availStart.setHours(0,0,0,0);
            const availEnd = new Date(availStart);
            availEnd.setHours(23,59,59,999);

            const pendingSales = await DirectMilkSale.find({
                farmer: avail.farmer._id,
                shift: avail.shift,
                status: 'pending',
                date: { $gte: availStart, $lte: availEnd }
            });
            const pendingQty = pendingSales.reduce((sum, s) => sum + s.quantity, 0);
            
            console.log(`Farmer: ${avail.farmer?.username}, Date: ${avail.date.toISOString()}, Shift: ${avail.shift}`);
            console.log(`  Avail Start: ${availStart.toISOString()}, End: ${availEnd.toISOString()}`);
            console.log(`  Pending Sales Found: ${pendingSales.length}, Total Pending Qty: ${pendingQty}`);
            console.log(`  Final remainingQty: ${avail.availableQuantity - pendingQty}`);
        }

        console.log('\n--- Deep Debug: All Pending Sales for Sachu ---');
        const sachu = await Farmer.findOne({ username: 'sachu' });
        if (sachu) {
            const allSales = await DirectMilkSale.find({ farmer: sachu._id });
            allSales.forEach(s => {
                console.log(`ID: ${s._id}, Date: ${s.date.toISOString()}, Shift: ${s.shift}, Status: ${s.status}, Qty: ${s.quantity}`);
            });
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
