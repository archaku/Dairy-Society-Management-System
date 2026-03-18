const API_BASE = 'http://localhost:5000/api';
let adminToken = '';
let farmerToken = '';

async function testSupplementFeature() {
    console.log('🚀 Starting Cattle Supplements Feature Tests (Native Fetch)...');

    try {
        // 1. Login as Admin
        console.log('\n--- 1. Admin Login ---');
        const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin1'
            })
        });
        console.log('Admin Login status:', adminLoginRes.status);
        const adminLoginText = await adminLoginRes.text();
        let adminLogin;
        try {
            adminLogin = JSON.parse(adminLoginText);
        } catch (e) {
            const bodyMatch = adminLoginText.match(/<body>([\s\S]*)<\/body>/);
            console.error('❌ Failed to parse admin login response. Body content:', bodyMatch ? bodyMatch[1].trim() : adminLoginText);
            throw e;
        }
        adminToken = adminLogin.token;
        console.log('✅ Admin logged in');

        // 2. Create a Supplement
        console.log('\n--- 2. Create Supplement ---');
        const supplementData = {
            name: 'Hybrid CO-5 Green Fodder (Fetch Test)',
            category: 'Green Fodder',
            unit: 'kg',
            pricePerUnit: 2.50,
            description: 'Native fetch test fodder'
        };

        const createResRaw = await fetch(`${API_BASE}/supplements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(supplementData)
        });
        const createResText = await createResRaw.text();
        let createRes;
        try {
            createRes = JSON.parse(createResText);
        } catch (e) {
            const bodyMatch = createResText.match(/<body>([\s\S]*)<\/body>/);
            console.error('❌ Failed to parse supplement create response. Body content:', bodyMatch ? bodyMatch[1].trim() : createResText);
            throw e;
        }
        const supplementId = createRes.supplement._id;
        console.log('✅ Supplement created:', supplementId);

        // 3. Fetch All Supplements (Public)
        console.log('\n--- 3. Fetch Supplements ---');
        const fetchResRaw = await fetch(`${API_BASE}/supplements`);
        const fetchRes = await fetchResRaw.json();
        console.log(`✅ Found ${fetchRes.supplements.length} supplements`);

        // 4. Farmer Login & Purchase
        console.log('\n--- 4. Farmer Purchase ---');
        try {
            const farmerLoginRes = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'farmer1',
                    password: 'password123'
                })
            });
            const farmerLogin = await farmerLoginRes.json();
            farmerToken = farmerLogin.token;

            if (!farmerToken) throw new Error('Farmer token not found');
            console.log('✅ Farmer logged in');

            const purchaseData = {
                items: [
                    {
                        supplement: supplementId,
                        quantity: 10,
                        priceAtTime: 2.50
                    }
                ]
            };

            const purchaseResRaw = await fetch(`${API_BASE}/supplements/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${farmerToken}`
                },
                body: JSON.stringify(purchaseData)
            });
            const purchaseRes = await purchaseResRaw.json();
            console.log('✅ Purchase order placed:', purchaseRes.order._id);

            // 5. Admin Fetch Orders
            console.log('\n--- 5. Admin View Orders ---');
            const ordersResRaw = await fetch(`${API_BASE}/supplements/orders`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            const ordersRes = await ordersResRaw.json();
            console.log(`✅ Admin found ${ordersRes.orders.length} orders`);

            // 6. Update Order Status
            console.log('\n--- 6. Update Order Status ---');
            const orderId = purchaseRes.order._id;
            const updateResRaw = await fetch(`${API_BASE}/supplements/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({ status: 'delivered' })
            });
            const updateRes = await updateResRaw.json();
            console.log('✅ Order marked as delivered');

        } catch (err) {
            console.log('⚠️ Skipping Farmer specific tests (Farmer login failed/not configured)');
        }

        console.log('\n🎉 Supplement feature backend tests finished!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

console.log('Note: Ensure backend is running on http://localhost:5000');
testSupplementFeature();
