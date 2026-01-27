# Email Troubleshooting Guide

## Issue: Not Receiving Report Emails

### Possible Causes & Solutions

#### 1. Gmail Security Settings
**Problem:** Gmail blocks "less secure apps" by default.

**Solution:**
1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Scroll down to **App passwords**
4. Generate a new app password for "Mail"
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
6. Update `.env` file:
   ```env
   SMTP_PASS="abcdefghijklmnop"  # Remove spaces
   ```

#### 2. Check Server Logs
After restarting the server, you should see:
```
✅ Email server is ready to send messages
```

If you see an error instead:
```
❌ Email transporter error: [error details]
```

Common errors:
- **Invalid login**: Wrong email or password
- **Connection timeout**: Firewall blocking port 587
- **Authentication failed**: Need app password instead of regular password

#### 3. Test Email Manually

Create a test file `test-email.cjs`:

```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

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
        console.log('Testing email configuration...');
        console.log('SMTP_HOST:', process.env.SMTP_HOST);
        console.log('SMTP_PORT:', process.env.SMTP_PORT);
        console.log('SMTP_USER:', process.env.SMTP_USER);
        console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
        
        const info = await transporter.sendMail({
            from: `"Test" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER,
            subject: "Test Email from HSM Developer Hub",
            html: "<h1>Test Email</h1><p>If you receive this, email is working!</p>"
        });
        
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
    } catch (error) {
        console.error('❌ Email failed:');
        console.error('Error:', error.message);
        console.error('Code:', error.code);
        console.error('Command:', error.command);
    }
}

testEmail();
```

Run it:
```bash
node test-email.cjs
```

#### 4. Check .env File

Verify your `.env` file has correct values:

```env
SMTP_USER=fh.developercommunity@gmail.com
SMTP_PASS="your_app_password_here"  # Use app password, not regular password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

**Important:** 
- Remove any extra quotes or spaces
- Use app password (16 characters) not your Gmail password
- Port should be 587 (not 465 or 25)

#### 5. Alternative: Use Gmail OAuth2

If app passwords don't work, you can use OAuth2:

```javascript
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.SMTP_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN
    }
});
```

#### 6. Check Spam Folder

Sometimes emails go to spam. Check:
1. Gmail Spam folder
2. Gmail "All Mail" folder
3. Gmail filters (Settings → Filters)

#### 7. Firewall/Antivirus

Some firewalls block SMTP ports:
- Temporarily disable firewall
- Add exception for port 587
- Try from a different network

#### 8. Use Alternative SMTP Service

If Gmail continues to have issues, try:

**SendGrid (Free tier: 100 emails/day):**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your_mailgun_password
```

## Debugging Steps

### Step 1: Check Server Startup
When you run `npm run dev`, look for:
```
✅ Email server is ready to send messages
```

### Step 2: Submit a Test Report
1. Go to community page
2. Click report on any post
3. Select a reason
4. Submit

### Step 3: Check Server Console
You should see:
```
📧 Attempting to send report email...
From: fh.developercommunity@gmail.com
To: fh.developercommunity@gmail.com
Subject: 🚨 New Content Report - [Reason]
✅ Report email sent successfully!
Message ID: <message-id>
Response: 250 OK
```

If you see an error instead, the error message will tell you what's wrong.

### Step 4: Check Email Inbox
- Check inbox
- Check spam
- Check "All Mail"
- Search for "HSM Developer Hub"

## Common Error Messages

### "Invalid login: 535-5.7.8 Username and Password not accepted"
**Solution:** Use app password instead of regular Gmail password

### "Connection timeout"
**Solution:** Firewall is blocking port 587

### "self signed certificate"
**Solution:** Already handled with `rejectUnauthorized: false`

### "ECONNREFUSED"
**Solution:** Wrong SMTP host or port

### "Missing credentials"
**Solution:** SMTP_USER or SMTP_PASS not set in .env

## Quick Fix Checklist

- [ ] Using Gmail app password (not regular password)
- [ ] .env file has correct SMTP settings
- [ ] Server restarted after changing .env
- [ ] Port 587 not blocked by firewall
- [ ] Email server shows "ready" on startup
- [ ] Checked spam folder
- [ ] Tested with test-email.cjs script
- [ ] Checked server console for errors

## Still Not Working?

If emails still don't work:

1. **Use console logging instead (temporary):**
   Comment out the email sending and just log to console:
   ```javascript
   console.log('📧 REPORT RECEIVED:');
   console.log('Report ID:', reportId);
   console.log('Reason:', reason);
   console.log('Custom Reason:', custom_reason);
   console.log('Post ID:', post_id);
   console.log('Reporter:', req.userId);
   ```

2. **Check database:**
   ```sql
   SELECT * FROM reports ORDER BY created_at DESC LIMIT 5;
   ```
   Reports should still be saved even if email fails.

3. **Contact support:**
   - Gmail support for account issues
   - Check Google Account security alerts
   - Try from a different Gmail account

## Success Indicators

When everything works, you'll see:

**Server Console:**
```
✅ Email server is ready to send messages
📧 Attempting to send report email...
From: fh.developercommunity@gmail.com
To: fh.developercommunity@gmail.com
Subject: 🚨 New Content Report - Spam or misleading
✅ Report email sent successfully!
Message ID: <abc123@gmail.com>
Response: 250 2.0.0 OK 1234567890 abc123def456
```

**Email Inbox:**
- Email from "HSM Developer Hub"
- Subject: "🚨 New Content Report - [Reason]"
- Professional HTML formatting
- All report details included
