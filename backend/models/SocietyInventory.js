const mongoose = require('mongoose');

const societyInventorySchema = new mongoose.Schema({
    totalStock: {
        type: Number,
        default: 0,
        min: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'society_inventory'
});

module.exports = mongoose.model('SocietyInventory', societyInventorySchema);
