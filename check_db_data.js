const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const User = require('./backend/models/User');
const Farmer = require('./backend/models/Farmer');

async function checkData() {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const userCount = await User.countDocuments();
        const farmerCount = await Farmer.countDocuments();

        console.log(`Total Users: ${userCount}`);
        console.log(`Total Farmers: ${farmerCount}`);

        const users = await User.find({}, 'username email firstName lastName').limit(5);
        console.log('\nSample Users:', JSON.stringify(users, null, 2));

        const farmers = await Farmer.find({}, 'username email firstName lastName').limit(5);
        console.log('\nSample Farmers:', JSON.stringify(farmers, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkData();
