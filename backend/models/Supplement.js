const mongoose = require('mongoose');

const supplementSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Green Fodder', 'Dry Fodder', 'Concentrate Feed', 'Cattle Supplements']
    },
    unit: {
        type: String,
        required: true,
        default: 'kg' // kg, bag, unit
    },
    pricePerUnit: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String, // URL to image
        required: false
    },
    inStock: {
        type: Boolean,
        default: true
    },
    targetBenefit: {
        type: String,
        enum: ['general_health', 'boosts_fat', 'boosts_snf', 'boosts_protein', 'boosts_lactose', 'balances_ph', 'increases_yield'],
        default: 'general_health'
    }
}, {
    timestamps: true,
    collection: 'supplements'
});

module.exports = mongoose.model('Supplement', supplementSchema);
