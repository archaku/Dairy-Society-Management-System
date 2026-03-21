const axios = require('axios');
require('dotenv').config();

async function checkStock() {
    try {
        const res = await axios.get('http://localhost:5000/api/direct-milk/farmers');
        const sachu = res.data.availabilities.find(a => a.farmer.username === 'sachu');
        console.log('Sachu Stock:', sachu ? sachu.availableQuantity : 'Not found');
        console.log('Details:', JSON.stringify(sachu, null, 2));
    } catch (err) {
        console.error(err.message);
    }
}

checkStock();
