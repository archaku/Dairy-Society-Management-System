const axios = require('axios');
require('dotenv').config();

async function testInventoryAPI() {
    try {
        // Need to login as admin first to get token
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'admin',
            password: 'admin123' // Default admin password
        });
        const token = loginRes.data.token;

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        const res = await axios.get('http://localhost:5000/api/society/inventory', config);
        console.log('API Response:', JSON.stringify(res.data, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

testInventoryAPI();
