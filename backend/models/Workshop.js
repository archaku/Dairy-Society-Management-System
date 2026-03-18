const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    totalSlots: {
        type: Number,
        required: true,
        default: 0
    },
    bookedBy: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            userModel: {
                type: String,
                required: true,
                enum: ['User', 'Farmer']
            },
            bookedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    }
}, {
    timestamps: true,
    collection: 'workshops'
});

module.exports = mongoose.model('Workshop', workshopSchema);
