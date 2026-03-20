const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
    console.log('📊 Database:', mongoose.connection.name);
    // Create default admin after connection
    require('./config/createAdmin')();
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('💡 Please check your MongoDB connection string in .env file');
    process.exit(1);
  });

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/milk', require('./routes/milkRoutes'));
app.use('/api/purchase', require('./routes/milkPurchaseRoutes'));
app.use('/api/workshops', require('./routes/workshopRoutes'));
app.use('/api/supplements', require('./routes/supplementRoutes'));
app.use('/api/direct-milk', require('./routes/directMilkRoutes'));
app.use('/api/society', require('./routes/societySalesRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));

// Serve static files from uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'DSMS Backend is running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
