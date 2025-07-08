const { createEmailLayout } = require('./base');

module.exports = {
  subject: 'Reset your password',
  html: (name, resetUrl) => {
    const content = `
      <h2>Password Reset Request</h2>
      <p>Hi <span class="highlight">${name}</span>,</p>
      <p>We received a request to reset your WayPoint password.</p>
      
      <div class="card">
        <h3>Security first</h3>
        <p>To protect your account, click the button below to set a new secure password.</p>
      </div>
      
      <div class="text-center">
        <a href="${resetUrl}" class="btn">
          Reset my password
        </a>
      </div>
      
      <div class="alert alert-warning">
        <strong>Important:</strong> This link will expire in <strong>24 hours</strong>.
      </div>
      
      <div class="alert alert-info">
        <strong>For your security:</strong><br>
        • This link can only be used once<br>
        • If you didn't request this reset, you can safely ignore this email<br>
        • Your current password remains valid until you change it
      </div>
      
      <div class="divider"></div>
      
      <p class="text-muted">
        If the button doesn't work, copy this link into your browser:<br>
        <span class="text-small">${resetUrl}</span>
      </p>
    `;

    return createEmailLayout(content, {
      title: 'Reset your password',
      preheader: 'Reset your WayPoint password'
    });
  }
}; 
