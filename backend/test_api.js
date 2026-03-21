const axios = require('axios');

async function testApi() {
    try {
        const res = await axios.get('http://localhost:5000/api/direct-milk/farmers');
        console.log('Availabilities:', JSON.stringify(res.data.availabilities, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testApi();
