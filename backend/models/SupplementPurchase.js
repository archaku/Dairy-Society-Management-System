const mongoose = require('mongoose');

const supplementPurchaseSchema = new mongoose.Schema({
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true
    },
    items: [
        {
            supplement: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Supplement',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 0.1
            },
            priceAtTime: {
                type: Number,
                required: true
            }
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'Completed', 'Failed'],
        default: 'pending'
    },
    invoicePath: {
        type: String
    },
    paymentId: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'supplement_purchases'
});

module.exports = mongoose.model('SupplementPurchase', supplementPurchaseSchema);
