const { createEmailLayout } = require('./base');

module.exports = {
  subject: 'Confirm your email address',
  html: (verifyUrl) => {
    const content = `
      <h2>Welcome to WayPoint!</h2>
      <p>Thank you for joining our community of map creators!</p>
      
      <div class="card">
        <h3>One last step</h3>
        <p>To activate your account and start creating extraordinary maps, simply confirm your email address.</p>
      </div>
      
      <div class="text-center">
        <a href="${verifyUrl}" class="btn">
          Confirm my email
        </a>
      </div>
      
      <div class="alert alert-info">
        <strong>Security:</strong> This step protects your account and ensures we can contact you if needed.
      </div>
      
      <div class="card">
        <h3>What awaits you:</h3>
        <p>• Create interactive maps for your travels<br>
        • Collaborate with friends in real time<br>
        • Share your discoveries with the community<br>
        • Explore maps created by other travelers</p>
      </div>
      
      <div class="divider"></div>
      
      <p class="text-muted">
        If the button doesn't work, copy this link into your browser:<br>
        <span class="text-small">${verifyUrl}</span>
      </p>
    `;

    return createEmailLayout(content, {
      title: 'Confirm your email address',
      preheader: 'Activate your WayPoint account in one click'
    });
  }
}; 
