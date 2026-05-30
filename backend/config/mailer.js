const nodemailer = require('nodemailer');
require('dotenv').config();

const emailUser =
String(process.env.EMAIL_USER || '').trim();

const emailPass =
String(process.env.EMAIL_PASS || '').replace(/\s/g, '');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
        user: emailUser,
        pass: emailPass
    }
});

module.exports = transporter;
