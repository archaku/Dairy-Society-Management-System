const mongoose = require('mongoose');

const subscriptionDeliverySchema = new mongoose.Schema({
    subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MilkSubscription',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    shift: {
        type: String,
        enum: ['Morning', 'Evening'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'delivered', 'cancelled'],
        default: 'pending'
    },
    deliveredAt: {
        type: Date
    }
}, {
    timestamps: true,
    collection: 'subscription_deliveries'
});

// Ensure only one delivery log per day per subscription
subscriptionDeliverySchema.index({ subscriptionId: 1, date: 1, shift: 1 }, { unique: true });

module.exports = mongoose.model('SubscriptionDelivery', subscriptionDeliverySchema);
