const mongoose = require('mongoose');

const directMilkSaleSchema = new mongoose.Schema({
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
    quantity: {
        type: Number,
        required: true,
        min: 0.1
    },
    pricePerLiter: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'delivered', 'cancelled'],
        default: 'pending'
    },
    remark: {
        type: String,
        trim: true
    },
    feedback: {
        type: String,
        trim: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
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
    collection: 'direct_milk_sales'
});

module.exports = mongoose.model('DirectMilkSale', directMilkSaleSchema);
