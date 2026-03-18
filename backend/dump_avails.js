const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const Farmer = require('./models/Farmer'); // Need to register Farmer schema
const FarmerAvailability = require('./models/FarmerAvailability');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const all = await FarmerAvailability.find({}).populate('farmer');
        console.log(`Total records in FarmerAvailability: ${all.length}`);
        all.forEach(a => {
            console.log(`ID: ${a._id}, FarmerName: ${a.farmer?.firstName} ${a.farmer?.lastName}, Date: ${a.date ? a.date.toISOString() : 'MISSING'}, Qty: ${a.availableQuantity}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
check();
