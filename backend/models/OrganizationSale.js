const mongoose = require('mongoose');

const organizationSaleSchema = new mongoose.Schema({
    organizationName: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    pricePerLiter: {
        type: Number,
        required: true,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'organization_sales'
});

module.exports = mongoose.model('OrganizationSale', organizationSaleSchema);
