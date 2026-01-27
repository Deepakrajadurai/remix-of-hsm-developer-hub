const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('=== Email Configuration Test ===\n');

console.log('Environment Variables:');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
console.log('');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

async function testEmail() {
    try {
        console.log('Testing SMTP connection...');

        // Verify connection
        await transporter.verify();
        console.log('✅ SMTP connection verified!\n');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: `"HSM Developer Hub Test" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER,
            subject: "✅ Test Email from HSM Developer Hub",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #10b981;">✅ Email Configuration Working!</h1>
                    <p>If you're reading this, your email configuration is set up correctly.</p>
                    <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
                    <p><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</p>
                    <p><strong>From:</strong> ${process.env.SMTP_USER}</p>
                    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; color: #666; font-size: 14px;">
                        This is a test email from HSM Developer Hub Community System.
                    </p>
                </div>
            `
        });

        console.log('\n✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
        console.log('\n📬 Check your inbox at:', process.env.SMTP_USER);
        console.log('(Also check spam folder if you don\'t see it)\n');

    } catch (error) {
        console.error('\n❌ Email test failed!\n');
        console.error('Error Type:', error.name);
        console.error('Error Message:', error.message);

        if (error.code) {
            console.error('Error Code:', error.code);
        }

        if (error.command) {
            console.error('Failed Command:', error.command);
        }

        console.error('\nFull Error:', error);

        console.log('\n📋 Troubleshooting Tips:');
        console.log('1. Make sure you\'re using a Gmail App Password, not your regular password');
        console.log('2. Generate one at: https://myaccount.google.com/apppasswords');
        console.log('3. Update SMTP_PASS in your .env file');
        console.log('4. Restart the server after changing .env');
        console.log('5. Check if port 587 is blocked by firewall\n');
    }
}

testEmail();
