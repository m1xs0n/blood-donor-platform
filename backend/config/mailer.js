const nodemailer = require('nodemailer');
require('dotenv').config();

const getEmailConfig = () => {
    const resendApiKey =
    String(process.env.RESEND_API_KEY || '').trim();

    const fromEmail =
    String(
        process.env.EMAIL_FROM ||
        process.env.EMAIL_USER ||
        'Blood Donor Platform <onboarding@resend.dev>'
    ).trim();

    const gmailUser =
    String(process.env.EMAIL_USER || '').trim();

    const gmailPass =
    String(process.env.EMAIL_PASS || '').replace(/\s/g, '');

    return {
        resendApiKey,
        fromEmail,
        gmailUser,
        gmailPass
    };
};

const sendWithResend = async ({
    to,
    subject,
    html
}) => {
    const {
        resendApiKey,
        fromEmail
    } = getEmailConfig();

    if (!resendApiKey) {
        throw new Error('RESEND_API_KEY is not configured');
    }

    const response =
    await fetch(
        'https://api.resend.com/emails',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: fromEmail,
                to,
                subject,
                html
            })
        }
    );

    const data =
    await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            `Resend error ${response.status}`
        );
    }

    return data;
};

const sendWithGmail = async ({
    to,
    subject,
    html
}) => {
    const {
        gmailUser,
        gmailPass
    } = getEmailConfig();

    if (
        !gmailUser ||
        !gmailPass
    ) {
        throw new Error('Gmail credentials are not configured');
    }

    const transporter =
    nodemailer.createTransport({
        service: 'gmail',
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
            user: gmailUser,
            pass: gmailPass
        }
    });

    return transporter.sendMail({
        from: gmailUser,
        to,
        subject,
        html
    });
};

exports.sendEmail = async (message) => {
    const {
        resendApiKey
    } = getEmailConfig();

    if (resendApiKey) {
        return sendWithResend(message);
    }

    return sendWithGmail(message);
};
