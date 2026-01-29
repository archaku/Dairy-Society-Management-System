const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const fixAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin exists
    const admin = await User.findOne({ username: 'admin' });
    
    if (admin) {
      console.log('ℹ️  Admin user found:', {
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive
      });

      // Reset admin password - set plain text, pre-save hook will hash it
      // Using 'admin1' (6 chars) to meet validation requirement
      admin.password = 'admin1';
      admin.markModified('password');
      await admin.save();
      console.log('✅ Admin password reset to: admin1');
      
      // Verify password
      const passwordMatch = await admin.comparePassword('admin1');
      console.log('🔍 Password verification:', passwordMatch ? '✅ PASSED' : '❌ FAILED');
    } else {
      console.log('⚠️  Admin user not found. Creating new admin...');
      
      // Create new admin - set plain text password, pre-save hook will hash it
      const newAdmin = new User({
        username: 'admin',
        email: 'admin@dsms.com',
        password: 'admin1', // 6 characters to meet validation requirement
        firstName: 'Admin',
        lastName: 'User',
        phone: '0000000000',
        role: 'admin',
        address: 'Areeparambu, Cherthala',
        isActive: true
      });

      await newAdmin.save();
      console.log('✅ Admin user created successfully');
      console.log('   Username: admin');
      console.log('   Password: admin1');
    }

    // Verify the admin can be found and password works
    const verifyAdmin = await User.findOne({ username: 'admin' });
    if (verifyAdmin) {
      const passwordMatch = await verifyAdmin.comparePassword('admin1');
      console.log('✅ Final password verification:', passwordMatch ? 'PASSED' : 'FAILED');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixAdmin();
