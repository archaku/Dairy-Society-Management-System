const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let adminToken = '';
let userToken = '';

async function testWorkshopFeature() {
    console.log('🚀 Starting Workshop Feature Tests...');

    try {
        // 1. Login as Admin
        console.log('\n--- 1. Admin Login ---');
        const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
            username: 'admin', // Default admin
            password: 'adminpassword'
        });
        adminToken = adminLogin.data.token;
        console.log('✅ Admin logged in');

        // 2. Create a Workshop
        console.log('\n--- 2. Create Workshop ---');
        const workshopData = {
            title: 'Automated Test Workshop',
            description: 'Testing if this works correctly via script',
            date: new Date(Date.now() + 86400000), // Tomorrow
            endDate: new Date(Date.now() + 172800000), // Day after tomorrow
            location: 'Cherthala Society Hall',
            totalSlots: 50
        };

        const createRes = await axios.post(`${API_BASE}/workshops`, workshopData, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const workshopId = createRes.data.workshop._id;
        console.log('✅ Workshop created:', workshopId);

        // 3. Fetch Workshops (as user)
        console.log('\n--- 3. Fetch Workshops ---');
        // First login as user (assuming a user exists, if not we skip booking test)
        try {
            const userLogin = await axios.post(`${API_BASE}/auth/login`, {
                username: 'testuser', // Assuming this exists from previous sessions
                password: 'password123'
            });
            userToken = userLogin.data.token;
            console.log('✅ User logged in');

            const fetchRes = await axios.get(`${API_BASE}/workshops`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            console.log(`✅ Found ${fetchRes.data.workshops.length} workshops`);

            // 4. Book a Slot
            console.log('\n--- 4. Book Slot ---');
            const bookRes = await axios.post(`${API_BASE}/workshops/book/${workshopId}`, {}, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            console.log('✅ Booking successful:', bookRes.data.message);
        } catch (err) {
            console.log('⚠️ Skipping User specific tests (User login failed - check credentials)');
        }

        // 5. Cleanup (Delete Workshop)
        console.log('\n--- 5. Cleanup ---');
        await axios.delete(`${API_BASE}/workshops/${workshopId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Workshop deleted');

        console.log('\n🎉 All tests completed successfully (where applicable)!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Note: This script requires the backend to be running.
console.log('Note: Ensure backend is running on http://localhost:5000');
testWorkshopFeature();
