const mongoose = require('mongoose');

const milkPurchaseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0.1
    },
    rate: {
        type: Number,
        default: 50
    },
    deliveryCharge: {
        type: Number,
        default: 10
    },
    deliveryType: {
        type: String,
        enum: ['COD', 'Takeaway'],
        default: 'COD'
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['COD'],
        default: 'COD'
    },
    status: {
        type: String,
        enum: ['pending', 'delivered', 'cancelled'],
        default: 'pending'
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'milk_purchases'
});

module.exports = mongoose.model('MilkPurchase', milkPurchaseSchema);
