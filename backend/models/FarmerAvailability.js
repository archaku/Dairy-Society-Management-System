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
    },
    shift: {
        type: String,
        enum: ['Morning', 'Evening'],
        required: true
    }
}, {
    timestamps: true,
    collection: 'farmer_availabilities_shift'
});

// Ensure a farmer can only have one availability record per shift per day
farmerAvailabilitySchema.index({ farmer: 1, date: 1, shift: 1 }, { unique: true });

module.exports = mongoose.model('FarmerAvailability', farmerAvailabilitySchema);
