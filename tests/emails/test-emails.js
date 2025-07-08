#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Mock environment variables for tests
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// Import templates
const { createEmailLayout } = require('../../src/templates/emails/base');

const mapInvitationTemplates = {
  en: require('../../src/templates/emails/mapInvitation.en'),
  fr: require('../../src/templates/emails/mapInvitation.fr')
};

const invitationResponseTemplates = {
  en: require('../../src/templates/emails/invitationResponse.en'),
  fr: require('../../src/templates/emails/invitationResponse.fr')
};

const passwordResetTemplates = {
  en: require('../../src/templates/emails/passwordReset.en'),
  fr: require('../../src/templates/emails/passwordReset.fr')
};

const emailVerificationTemplates = {
  en: require('../../src/templates/emails/emailVerification.en'),
  fr: require('../../src/templates/emails/emailVerification.fr')
};

// Test data
const testData = {
  mapInvitation: {
    inviterName: 'Alexandre Dupont',
    mapName: 'Trip to Thailand 2024',
    role: 'collaborator',
    invitationUrl: 'http://localhost:3001/fr/invitations/test-token-123'
  },
  invitationResponse: {
    inviteeName: 'Marie Martin',
    mapName: 'Trip to Thailand 2024',
    statusAccepted: 'accepted',
    statusRejected: 'rejected'
  },
  passwordReset: {
    name: 'Alexandre Dupont',
    resetUrl: 'http://localhost:3001/reset-password/test-token-456'
  },
  verification: {
    verifyUrl: 'http://localhost:3001/verify-email?token=test-token-789'
  }
};

// Function to create test files
function createTestEmails() {
  const outputDir = path.join(__dirname, 'generated');

  // Create folder if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const emails = [];

  // 1. Map invitation (FR and EN)
  ['fr', 'en'].forEach(lang => {
    const template = mapInvitationTemplates[lang];
    const html = template.html(
      testData.mapInvitation.inviterName,
      testData.mapInvitation.mapName,
      testData.mapInvitation.role,
      testData.mapInvitation.invitationUrl
    );

    const filename = `map-invitation-${lang}.html`;
    fs.writeFileSync(path.join(outputDir, filename), html);
    emails.push({ name: `Map invitation (${lang.toUpperCase()})`, file: filename, subject: template.subject });
  });

  // 2. Invitation response - Accepted (FR and EN)
  ['fr', 'en'].forEach(lang => {
    const template = invitationResponseTemplates[lang];
    const html = template.html(
      testData.invitationResponse.inviteeName,
      testData.invitationResponse.mapName,
      testData.invitationResponse.statusAccepted
    );

    const filename = `invitation-response-accepted-${lang}.html`;
    fs.writeFileSync(path.join(outputDir, filename), html);
    emails.push({
      name: `Invitation response - Accepted (${lang.toUpperCase()})`,
      file: filename,
      subject: template.subject(testData.invitationResponse.statusAccepted)
    });
  });

  // 3. Invitation response - Rejected (FR and EN)
  ['fr', 'en'].forEach(lang => {
    const template = invitationResponseTemplates[lang];
    const html = template.html(
      testData.invitationResponse.inviteeName,
      testData.invitationResponse.mapName,
      testData.invitationResponse.statusRejected
    );

    const filename = `invitation-response-rejected-${lang}.html`;
    fs.writeFileSync(path.join(outputDir, filename), html);
    emails.push({
      name: `Invitation response - Rejected (${lang.toUpperCase()})`,
      file: filename,
      subject: template.subject(testData.invitationResponse.statusRejected)
    });
  });

  // 4. Password reset (FR and EN)
  ['fr', 'en'].forEach(lang => {
    const template = passwordResetTemplates[lang];
    const html = template.html(
      testData.passwordReset.name,
      testData.passwordReset.resetUrl
    );

    const filename = `password-reset-${lang}.html`;
    fs.writeFileSync(path.join(outputDir, filename), html);
    emails.push({ name: `Password reset (${lang.toUpperCase()})`, file: filename, subject: template.subject });
  });

  // 5. Email verification (FR and EN)
  ['fr', 'en'].forEach(lang => {
    const template = emailVerificationTemplates[lang];
    const html = template.html(testData.verification.verifyUrl);

    const filename = `email-verification-${lang}.html`;
    fs.writeFileSync(path.join(outputDir, filename), html);
    emails.push({ name: `Email verification (${lang.toUpperCase()})`, file: filename, subject: template.subject });
  });

  // Group emails by type
  const emailGroups = [
    {
      name: 'Map Invitation',
      description: 'Invitation to collaborate on a map',
      files: {
        en: 'map-invitation-en.html',
        fr: 'map-invitation-fr.html'
      }
    },
    {
      name: 'Invitation Response - Accepted',
      description: 'Notification when invitation is accepted',
      files: {
        en: 'invitation-response-accepted-en.html',
        fr: 'invitation-response-accepted-fr.html'
      }
    },
    {
      name: 'Invitation Response - Rejected',
      description: 'Notification when invitation is rejected',
      files: {
        en: 'invitation-response-rejected-en.html',
        fr: 'invitation-response-rejected-fr.html'
      }
    },
    {
      name: 'Password Reset',
      description: 'Email with secure reset link',
      files: {
        en: 'password-reset-en.html',
        fr: 'password-reset-fr.html'
      }
    },
    {
      name: 'Email Verification',
      description: 'Email address confirmation',
      files: {
        en: 'email-verification-en.html',
        fr: 'email-verification-fr.html'
      }
    }
  ];

  // Create index page
  const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WayPoint Email Preview</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap');
    
    body {
      font-family: 'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #003566;
      color: #ffffff;
      line-height: 1.6;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding: 40px 30px;
      background: linear-gradient(135deg, #001D3D 0%, #003566 100%);
      color: white;
      border-radius: 12px;
      border: 2px solid #FFC300;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 32px;
      font-weight: 700;
      color: #FFC300;
    }
    
    .header p {
      margin: 0;
      font-size: 18px;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 400;
    }
    
    .email-list {
      display: grid;
      gap: 20px;
    }
    
    .email-card {
      background-color: #001D3D;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    }
    
    .email-card:hover {
      border-color: #FFC300;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
      transform: translateY(-2px);
    }
    
    .email-card h3 {
      margin: 0 0 8px 0;
      color: #FFC300;
      font-size: 20px;
      font-weight: 600;
    }
    
    .email-card .description {
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      margin-bottom: 20px;
      font-style: italic;
    }
    
    .btn-group {
      display: flex;
      gap: 12px;
    }
    
    .btn {
      display: inline-block;
      padding: 10px 20px;
      background-color: #FFC300;
      color: #001D3D !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
      border: 2px solid #FFC300;
      flex: 1;
      text-align: center;
    }
    
    .btn:hover {
      background-color: #001D3D;
      color: #FFC300 !important;
      border-color: #FFC300;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(255, 195, 0, 0.3);
    }
    
    .btn.btn-fr {
      background-color: rgba(255, 195, 0, 0.1);
      color: #FFC300 !important;
      border-color: #FFC300;
    }
    
    .btn.btn-fr:hover {
      background-color: #FFC300;
      color: #001D3D !important;
    }
    
    .footer {
      text-align: center;
      margin-top: 50px;
      padding: 24px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .footer code {
      background-color: rgba(255, 195, 0, 0.1);
      color: #FFC300;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }
    
    /* Mobile responsiveness */
    @media only screen and (max-width: 600px) {
      body {
        padding: 15px;
      }
      
      .header {
        padding: 30px 20px;
      }
      
      .header h1 {
        font-size: 28px;
      }
      
      .header p {
        font-size: 16px;
      }
      
      .email-card {
        padding: 20px;
      }
      
      .btn-group {
        flex-direction: column;
        gap: 8px;
      }
      
      .btn {
        padding: 12px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>WayPoint Email Preview</h1>
    <p>All email templates with the new design</p>
  </div>

  <div class="email-list">
    ${emailGroups.map(group => `
      <div class="email-card">
        <h3>${group.name}</h3>
        <div class="description">${group.description}</div>
        <div class="btn-group">
          <a href="./${group.files.en}" target="_blank" class="btn">English</a>
          <a href="./${group.files.fr}" target="_blank" class="btn btn-fr">Français</a>
        </div>
      </div>
    `).join('')}
  </div>

  <div class="footer">
    <p>Generated on ${new Date().toLocaleString('en-US')}</p>
    <p>To regenerate, run: <code>node tests/emails/test-emails.js</code></p>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml);

  console.log('Test emails generated successfully!');
  console.log(`Folder: ${outputDir}`);
  console.log(`Open: file://${path.join(outputDir, 'index.html')}`);
  console.log('\nGenerated emails:');
  emails.forEach(email => console.log(`   • ${email.name}`));
}

// Execute if script is called directly
if (require.main === module) {
  createTestEmails();
}

module.exports = { createTestEmails }; 
