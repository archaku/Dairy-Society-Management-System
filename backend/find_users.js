const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Farmer = require('./models/Farmer');

async function findUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const users = await User.find({}).limit(5);
        console.log('Users:');
        users.forEach(u => console.log(`Username: ${u.username}, Role: user` /* Password is hashed */));

        const farmers = await Farmer.find({}).limit(5);
        console.log('Farmers:');
        farmers.forEach(f => console.log(`Username: ${f.username}, Role: farmer`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findUsers();
