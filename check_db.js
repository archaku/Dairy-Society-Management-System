const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/backend/.env' });

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dsms');
        const db = mongoose.connection.db;

        console.log("Connected to MongoDB via", process.env.MONGO_URI || 'local default');

        const farmer = await db.collection('farmers').findOne({ firstName: "Archa", lastName: "Udayan" });
        if (!farmer) {
            console.log("No farmer found named Archa Udayan");
            return process.exit(0);
        }
        console.log("Farmer found:", farmer._id, farmer.email);

        const milkRecords = await db.collection('milk_records').find({ farmer: farmer._id }).toArray();
        console.log(`Found ${milkRecords.length} milk records.`);

        const directSales = await db.collection('direct_milk_sales').find({ farmer: farmer._id }).toArray();
        console.log(`Found ${directSales.length} direct sales.`);

        if (milkRecords.length > 0) {
            console.log("First milk record createdAt:", milkRecords[0].createdAt, "date:", milkRecords[0].date);
        }

        process.exit(0);
    } catch (error) {
        console.error("DB Error:", error);
        process.exit(1);
    }
}

checkData();
