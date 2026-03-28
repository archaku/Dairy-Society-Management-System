const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dsms');
        const db = mongoose.connection.db;

        console.log("Connected to MongoDB");

        const farmer = await db.collection('farmers').findOne({ firstName: "Archa", lastName: "Udayan" });
        if (!farmer) {
            console.log("No farmer found named Archa Udayan");
            return process.exit(0);
        }
        console.log("Farmer found:", farmer._id, farmer.email);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const incomeTracker = await db.collection('milk_records').aggregate([
            {
                $match: {
                    farmer: farmer._id,
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    earnings: { $sum: "$totalAmount" },
                    quantity: { $sum: "$quantity" }
                }
            },
            { $sort: { "_id": 1 } }
        ]).toArray();

        console.log("Income Tracker Array:", JSON.stringify(incomeTracker, null, 2));

        const directSalesTracker = await db.collection('direct_milk_sales').aggregate([
            {
                $match: {
                    farmer: farmer._id,
                    status: { $in: ['approved', 'delivered'] },
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    earnings: { $sum: "$totalAmount" },
                    quantity: { $sum: "$quantity" }
                }
            }
        ]).toArray();

        console.log("Direct Sales Tracker Array:", JSON.stringify(directSalesTracker, null, 2));

        process.exit(0);
    } catch (error) {
        console.error("DB Error:", error);
        process.exit(1);
    }
}

checkData();
