const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' }); // Assuming DSMS/backend/.env

async function test() {
    try {
        // Find a user and farmer
        const mongoose = require('mongoose');
        await mongoose.connect('mongodb://localhost:27017/dsms');
        
        const User = require('./models/User');
        const Farmer = require('./models/Farmer');
        
        const user = await User.findOne({role: 'user'});
        const farmer = await Farmer.findOne({offersPreBooking: true});
        
        if (!user || !farmer) {
            console.log("No user or farmer found");
            process.exit(1);
        }
        
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'secret');
        
        console.log(`Sending request for user ${user.email} to farmer ${farmer.firstName}`);
        
        const res = await axios.post('http://localhost:5000/api/direct-milk/request', {
            farmerId: farmer._id,
            quantity: 2,
            shift: 'Morning',
            date: '2026-04-10'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Success!', res.data);
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
    process.exit(0);
}

test();
