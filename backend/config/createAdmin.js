const Admin = require('../models/Admin');

const createAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await Admin.findOne({ username: 'admin' });

    if (!adminExists) {
      const admin = new Admin({
        username: 'admin',
        email: 'admin@dsms.com',
        password: 'admin1', // 6 characters to meet validation requirement
        firstName: 'Admin',
        lastName: 'User',
        phone: '0000000000',
        isActive: true
      });

      await admin.save();
      console.log('✅ Default admin user created (username: admin, password: admin1)');
    } else {
      console.log('ℹ️  Admin user already exists');
      // Verify admin password is correct (reset if needed)
      const passwordMatch = await adminExists.comparePassword('admin1');
      if (!passwordMatch) {
        console.log('⚠️  Admin password mismatch. Resetting password...');
        // Set plain text password - the pre-save hook will hash it
        adminExists.password = 'admin1';
        adminExists.markModified('password');
        await adminExists.save();
        console.log('✅ Admin password reset to: admin1');
        
        // Verify the password was set correctly
        const verifyMatch = await adminExists.comparePassword('admin1');
        console.log('🔍 Password verification after reset:', verifyMatch ? '✅ PASSED' : '❌ FAILED');
      } else {
        console.log('✅ Admin password is correct');
      }
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error('Full error:', error);
  }
};

module.exports = createAdmin;
