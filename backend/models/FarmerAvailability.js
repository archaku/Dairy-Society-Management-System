const mongoose = require('mongoose');

const farmerAvailabilitySchema = new mongoose.Schema({
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true
    },
    availableQuantity: {
        type: Number,
        required: true,
        min: 0
    },
    pricePerLiter: {
        type: Number,
        required: true,
        min: 0
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'farmer_availabilities'
});

// Ensure a farmer can only have one availability record per day
farmerAvailabilitySchema.index({ farmer: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('FarmerAvailability', farmerAvailabilitySchema);
