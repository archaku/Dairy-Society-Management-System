const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Farmer = require('./models/Farmer');
const User = require('./models/User');

dotenv.config();

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const farmers = await Farmer.find({}, 'username email');
        const users = await User.find({}, 'username email');

        console.log('--- Farmers ---');
        console.log(farmers);
        console.log('--- Users ---');
        console.log(users);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkUsers();
