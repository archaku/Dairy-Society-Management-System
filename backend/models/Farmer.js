const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const farmerSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  aadhar: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  avgRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  avgQualityScore: {
    type: Number,
    default: 0
  },
  totalMilkRecords: {
    type: Number,
    default: 0
  },
  availableQuantity: {
    type: Number,
    default: 0
  },
  offersSubscription: {
    type: Boolean,
    default: false
  },
  subscriptionMilkRate: {
    type: Number,
    default: 50
  },
  subscriptionDeliveryRange: {
    type: Number,
    default: 5 // max km
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscriptionDeliveryCharge: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'farmers'
});

// Hash password before saving
farmerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
farmerSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Farmer', farmerSchema);
