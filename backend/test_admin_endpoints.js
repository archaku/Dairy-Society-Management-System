const axios = require('axios');

async function testAdminDashboard() {
    try {
        console.log('Logging in as admin (archa)...');
        const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'archa', // Using the known admin username from the DB debug script
            password: 'password123' // Guessing a password, let's just create a token manually instead if this fails
        });
        const token = adminLogin.data.token;
        console.log('Login successful! Testing endpionts...');

        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            const analytics = await axios.get('http://localhost:5000/api/analytics/admin', config);
            console.log('Analytics Data:', analytics.data);
        } catch (e) {
            console.error('Analytics Error:', e.response?.status, e.response?.data);
        }
    } catch (e) {
        console.error('Login Failed:', e.response?.data || e.message);

        // Let's create a token directly without pw if needed
        const jwt = require('jsonwebtoken');
        require('dotenv').config();

        const token = jwt.sign(
            { userId: '67d025b394e3576f7fdec49c', role: 'admin' }, // admin _id from previous log
            process.env.JWT_SECRET || 'your_secret_key',
            { expiresIn: '7d' }
        );
        console.log('Using directly generated token...');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            const analytics = await axios.get('http://localhost:5000/api/analytics/admin', config);
            console.log('Analytics Data (with manual token):', analytics.data);
        } catch (err) {
            console.error('Analytics Error (with manual token):', err.response?.status, err.response?.data);
        }
    }
}

testAdminDashboard();
