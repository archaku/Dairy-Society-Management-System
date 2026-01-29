const axios = require('axios');

const test = async () => {
    try {
        console.log('Testing POST /api/milk...');
        const res = await axios.post('http://localhost:5000/api/milk');
        console.log('Response:', res.status);
    } catch (error) {
        console.log('Error Message:', error.response?.data?.message);
    }
};

test();
