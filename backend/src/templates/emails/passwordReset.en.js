module.exports = {
  subject: 'Reset your password',
  html: (name, resetUrl) => `
    <h2>Password Reset Request 🔐</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the button below to set a new password:</p>
    <p>
      <a href="${resetUrl}" style="background:#1e40af;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">
        Reset my password
      </a>
    </p>
    <p>If the button doesn't work, you can also copy and paste this URL into your browser:</p>
    <p>${resetUrl}</p>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
    <p>For security reasons, this link can only be used once.</p>
  `
} 
