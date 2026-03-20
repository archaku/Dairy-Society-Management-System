const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MilkRecord = require('./models/MilkRecord');
const MilkPurchase = require('./models/MilkPurchase');
const OrganizationSale = require('./models/OrganizationSale');
const DirectMilkSale = require('./models/DirectMilkSale');
const FarmerAvailability = require('./models/FarmerAvailability');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dairy_society', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log("Connected to DB");
    
    const milkRes = await MilkRecord.updateMany(
        { shift: { $exists: false } },
        { $set: { shift: 'Morning' } }
    );
    console.log("Updated MilkRecords:", milkRes.modifiedCount);

    const purRes = await MilkPurchase.updateMany(
        { shift: { $exists: false } },
        { $set: { shift: 'Morning' } }
    );
    console.log("Updated MilkPurchases:", purRes.modifiedCount);

    const orgRes = await OrganizationSale.updateMany(
        { shift: { $exists: false } },
        { $set: { shift: 'Morning' } }
    );
    console.log("Updated OrganizationSales:", orgRes.modifiedCount);

    const directRes = await DirectMilkSale.updateMany(
        { shift: { $exists: false } },
        { $set: { shift: 'Morning' } }
    );
    console.log("Updated DirectMilkSales:", directRes.modifiedCount);

    const availRes = await FarmerAvailability.updateMany(
        { shift: { $exists: false } },
        { $set: { shift: 'Morning' } }
    );
    console.log("Updated FarmerAvailability:", availRes.modifiedCount);

    console.log("Migration complete!");
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
