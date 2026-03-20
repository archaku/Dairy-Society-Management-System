require('dotenv').config();
const mongoose = require('mongoose');
const MilkRecord = require('./models/MilkRecord');
const { getAvailableMilkForShift } = require('./utils/inventory');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dairy_society', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log("Connected to DB");
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log("Local today boundary:", today);
    console.log("UTC today boundary:", today.toISOString());

    const shift = 'Morning';
    const matchQuery = {
        shift,
        $or: [
            { date: { $gte: today } },
            { createdAt: { $gte: today } }
        ]
    };
    
    console.log("Match Query:", JSON.stringify(matchQuery, null, 2));

    const records = await MilkRecord.find(matchQuery);
    console.log(`Found ${records.length} records for ${shift} today.`);
    records.forEach(r => console.log(` - ID: ${r._id}, Qty: ${r.quantity}, Date: ${r.date}, CreatedAt: ${r.createdAt}`));
    
    const allRecords = await MilkRecord.find({});
    console.log(`\nAll records in DB: ${allRecords.length}`);
    allRecords.forEach(r => console.log(` - ID: ${r._id}, Qty: ${r.quantity}, Date: ${r.date}, CreatedAt: ${r.createdAt}`));

    const avail = await getAvailableMilkForShift('Morning');
    console.log(`\nMorning Availability from util: ${avail}`);

    mongoose.connection.close();
}).catch(err => {
    console.error(err);
});
