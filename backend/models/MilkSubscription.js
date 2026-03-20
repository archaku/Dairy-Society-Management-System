const mongoose = require('mongoose');

const milkSubscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true
    },
    quantityPerDay: {
        type: Number,
        required: true,
        min: 0.1
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    shift: {
        type: String,
        enum: ['Morning', 'Evening'],
        required: true
    },
    pricePerLiter: {
        type: Number,
        required: true
    },
    deliveryCharge: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    deliveryLocation: {
        type: String,
        required: true
    },
    distance: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'Completed', 'Failed'],
        default: 'pending'
    },
    paymentId: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'completed', 'cancelled', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true,
    collection: 'milk_subscriptions'
});

module.exports = mongoose.model('MilkSubscription', milkSubscriptionSchema);
