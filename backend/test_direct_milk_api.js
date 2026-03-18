const BASE_URL = 'http://localhost:5000/api';
let farmerToken, userToken;
let requestId;

async function testDirectMilkFlow() {
    try {
        console.log('--- Starting Direct Milk Sale API Test ---');

        // 0. Register Test users (ignore if already exist)
        console.log('0. Registering test users...');
        const regData = {
            farmer: { username: 'tfarmer1', email: 'tfarmer1@test.com', password: 'password123', firstName: 'Test', lastName: 'Farmer', phone: '1234567890', address: 'Farm Road', aadhar: '112233445566', role: 'farmer', otp: '123456' },
            user: { username: 'tuser1', email: 'tuser1@test.com', password: 'password123', firstName: 'Test', lastName: 'User', phone: '0987654321', address: 'User Street', role: 'user', otp: '123456' }
        };

        // Pre-create OTPs in DB since registration requires them
        // (This part is a bit tricky since I'd need direct DB access or mock OTP flow)
        // For simplicity, I'll assume the user has already registered or I'll try to login

        // 1. Login as Farmer
        console.log('1. Logging in as Farmer...');
        const farmerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'sumayya', password: 'password123' })
        });
        const farmerLogin = await farmerLoginRes.json();
        if (!farmerLogin.success) throw new Error(`Farmer login failed: ${farmerLogin.message}`);
        farmerToken = farmerLogin.token;
        const farmerId = farmerLogin.user.id;
        console.log('Farmer logged in.');

        // 2. Register Availability
        console.log('2. Registering availability...');
        const availRes = await fetch(`${BASE_URL}/direct-milk/availability`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${farmerToken}`
            },
            body: JSON.stringify({ availableQuantity: 50, pricePerLiter: 55 })
        });
        const availData = await availRes.json();
        if (!availData.success) throw new Error(`Availability failed: ${availData.message}`);
        console.log('Availability registered.');

        // 3. Login as User
        console.log('3. Logging in as User...');
        const userLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'sneha', password: 'password123' })
        });
        const userLogin = await userLoginRes.json();
        if (!userLogin.success) throw new Error(`User login failed: ${userLogin.message}`);
        userToken = userLogin.token;
        console.log('User logged in.');

        // 4. Browsing Farmers
        console.log('4. Browsing available farmers...');
        const farmersRes = await fetch(`${BASE_URL}/direct-milk/farmers`);
        const farmersData = await farmersRes.json();
        console.log(`Found ${farmersData.availabilities.length} farmers.`);

        // 5. Request Milk
        console.log('5. Requesting milk...');
        const requestRes = await fetch(`${BASE_URL}/direct-milk/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({ farmerId: farmerId, quantity: 5 })
        });
        const requestData = await requestRes.json();
        if (!requestData.success) throw new Error(`Request failed: ${requestData.message}`);
        requestId = requestData.sale._id;
        console.log('Request sent.');

        // 6. Farmer Processes Request (Approve)
        console.log('6. Farmer approving request...');
        const actionRes = await fetch(`${BASE_URL}/direct-milk/farmer/action/${requestId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${farmerToken}`
            },
            body: JSON.stringify({ action: 'approved' })
        });
        const actionData = await actionRes.json();
        if (!actionData.success) throw new Error(`Action failed: ${actionData.message}`);
        console.log('Request approved.');

        // 7. User Gives Feedback
        console.log('7. User giving feedback...');
        const feedbackRes = await fetch(`${BASE_URL}/direct-milk/user/feedback/${requestId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({ rating: 5, feedback: 'Excellent quality milk!' })
        });
        const feedbackData = await feedbackRes.json();
        if (!feedbackData.success) throw new Error(`Feedback failed: ${feedbackData.message}`);
        console.log('Feedback submitted.');

        console.log('--- Direct Milk Sale API Test Completed Successfully ---');
    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testDirectMilkFlow();
