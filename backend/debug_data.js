const mongoose = require('mongoose');
require('dotenv').config();

const Farmer = require('./models/Farmer');
const Admin = require('./models/Admin');
const MilkRecord = require('./models/MilkRecord');

async function debugData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to dsms');

        const farmers = await Farmer.find({});
        console.log('Total Farmers in DB:', farmers.length);
        farmers.forEach(f => {
            console.log(`- ${f.username}: isActive=${f.isActive}, totalMilkRecords=${f.totalMilkRecords}, avgQualityScore=${f.avgQualityScore}`);
        });

        const activeFarmersCount = await Farmer.countDocuments({ isActive: true });
        console.log('Count of Active Farmers (query):', activeFarmersCount);

        const milkRecords = await MilkRecord.find({});
        console.log('Total Milk Records in DB:', milkRecords.length);
        if (milkRecords.length > 0) {
            console.log('Sample Record createdAt:', milkRecords[0].createdAt);
        }

        const admins = await Admin.find({});
        console.log('Total Admins in DB:', admins.length);
        admins.forEach(a => {
            console.log(`- ${a.username}: isActive=${a.isActive}, _id=${a._id}`);
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

debugData();
