# WayPoint Email Tests

This folder contains all testing and validation tools for WayPoint emails.

## 📁 Structure

```
tests/emails/
├── README.md                  # This file
├── test-email-sending.js      # Automated email sending tests
├── test-emails.js             # HTML email preview generation
├── setup-email-testing.md     # Email testing setup guide
└── generated/                 # Generated HTML previews folder
    ├── index.html              # Index page with all emails
    ├── map-invitation-fr.html
    ├── map-invitation-en.html
    └── ...
```

## 🧪 Usage

### Automated tests (no real sending)
```bash
# From backend/ folder
node tests/emails/test-email-sending.js
```
This script tests all email types and verifies:
- Correct template loading
- URL generation with proper locales  
- Required environment variables

### HTML preview generation
```bash
# From backend/ folder
node tests/emails/test-emails.js
```
Generates HTML files in `tests/emails/generated/` that you can open in your browser to preview the final email rendering.

### Index page
After generation, open `tests/emails/generated/index.html` to access a page with all testable emails.

## 📧 Tested email types

1. **Map invitations** (FR/EN)
   - Invitation to collaborate on a map

2. **Invitation responses** (FR/EN)  
   - Notification of invitation acceptance/rejection

3. **Password reset** (FR/EN)
   - Email with secure reset link

4. **Email verification** (FR/EN)
   - Email address confirmation

## ⚙️ Configuration

See `setup-email-testing.md` for complete configuration of email testing with Mailtrap.

## 🔍 Automatic verifications

Tests automatically verify:
- ✅ Correct URLs according to locale
- ✅ English fallback for invalid locales
- ✅ TEST mode prevents real email sending 
