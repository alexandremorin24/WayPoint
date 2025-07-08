# WayPoint Email Testing Guide

## 🧪 Testing without real sending

### Automated test script
```bash
# Run all email tests
node tests/emails/test-email-sending.js

# Generate HTML previews
node tests/emails/test-emails.js
```

## 📧 Email testing service

### Mailtrap (Recommended)
1. Create an account on [mailtrap.io](https://mailtrap.io)
2. Configure environment variables:
```env
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=587
MAIL_USER=your_mailtrap_username
MAIL_PASS=your_mailtrap_password
```

## 🔍 Variables to check

### Required environment variables:
- `FRONTEND_URL`: Frontend URL (e.g. http://localhost:3000)
- `MAIL_HOST`: SMTP server
- `MAIL_PORT`: SMTP port (587 for TLS, 465 for SSL)
- `MAIL_USER`: SMTP username
- `MAIL_PASS`: SMTP password

### Development mode
In development mode, email URLs are displayed in console:
```
📧 [DEV] Password reset email would be sent to: user@example.com
🔗 [DEV] Reset URL: http://localhost:3000/reset-password/abc123
🌍 [DEV] Using locale: fr
```

## 📝 Manual testing

### 1. Template testing
```javascript
// Test a template directly
const template = require('./src/templates/emails/passwordReset.fr');
const html = template.html('Test User', 'http://test.com/reset/token123');
console.log('Subject:', template.subject);
console.log('HTML contains user name:', html.includes('Test User'));
```

### 2. Locale testing
Emails support French (`fr`) and English (`en`) with fallback to English.

### 3. Content verification
- ✅ Consistent design with frontend
- ✅ Correct URLs according to locale

## 🚀 Production

In production, ensure:
1. `NODE_ENV=production` 
2. SMTP variables correctly configured
3. `FRONTEND_URL` points to the correct domain
4. Valid SSL/TLS certificates for SMTP server

## 📊 Monitoring

The mailer includes:
- Automatic retry system (3 attempts)
- Detailed error logging
- Error handling without crashing the application in dev/test 
