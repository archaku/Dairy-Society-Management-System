const mongoose = require('mongoose');

const milkRecordSchema = new mongoose.Schema({
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    fat: {
        type: Number,
        required: true
    },
    snf: {
        type: Number,
        required: true
    },
    lactose: {
        type: Number,
        required: true
    },
    protein: {
        type: Number,
        required: true
    },
    ph: {
        type: Number,
        required: true
    },
    qualityScore: {
        type: Number,
        required: true
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
        enum: ['pending', 'paid'],
        default: 'pending'
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
    collection: 'milk_records'
});

module.exports = mongoose.model('MilkRecord', milkRecordSchema);
