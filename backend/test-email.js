const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Testing Email Configuration:');
console.log('Service:', process.env.EMAIL_SERVICE);
console.log('User:', process.env.EMAIL_USER);

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ Verification Error:');
        console.error(error);
    } else {
        console.log('✅ Server is ready to take our messages');
    }
    process.exit();
});
