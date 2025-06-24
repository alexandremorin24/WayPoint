const nodemailer = require('nodemailer');
const passwordResetTemplates = {
  en: require('../templates/emails/passwordReset.en'),
  fr: require('../templates/emails/passwordReset.fr')
};
const mapInvitationTemplates = {
  en: require('../templates/emails/mapInvitation.en'),
  fr: require('../templates/emails/mapInvitation.fr')
};
const invitationResponseTemplates = {
  en: require('../templates/emails/invitationResponse.en'),
  fr: require('../templates/emails/invitationResponse.fr')
};

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT), // 587 for TLS, 465 for SSL
  secure: false, // Mailtrap uses STARTTLS on port 587
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  // Add retries configuration
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5
});

// Utility function for retries
async function sendMailWithRetry(mailOptions, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await transporter.sendMail(mailOptions);
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${i + 1} failed:`, error.message);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  }

  throw lastError;
}

/**
 * Send a verification email with a secure tokenized link.
 * @param {string} to - Recipient email
 * @param {string} token - JWT token for email verification
 * @param {string} locale - User's preferred language (en/fr)
 */
async function sendVerificationEmail(to, token, locale = 'en') {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: '"WayPoint" <no-reply@waypoint.app>',
    to,
    subject: 'Confirm your email address',
    html: `
      <h2>Welcome to WayPoint 👋</h2>
      <p>Please confirm your email address to activate your account:</p>
      <p>
        <a href="${verifyUrl}" style="background:#1e40af;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">
          Confirm my email
        </a>
      </p>
      <p>If the button doesn't work, you can also copy and paste this URL into your browser:</p>
      <p>${verifyUrl}</p>
    `,
  };

  try {
    // In development, display URL in console
    console.log('📧 [DEV] Verification email would be sent to:', to);
    console.log('🔗 [DEV] Verification URL:', verifyUrl);

    // Try to send email with retries
    await sendMailWithRetry(mailOptions);
    console.log(`📧 Verification email sent to ${to}`);
  } catch (err) {
    console.error('Failed to send verification email:', err);
    // In development, don't fail the request if email sending fails
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
  }
}

/**
 * Send a password reset email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} token - Password reset token
 * @param {string} locale - User's preferred language (en/fr)
 */
async function sendPasswordResetEmail(email, name, token, locale = 'en') {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  const fromAddress = process.env.MAIL_FROM || '"WayPoint" <no-reply@waypoint.app>';

  // Get template based on locale, fallback to English if locale not supported
  const template = passwordResetTemplates[locale] || passwordResetTemplates.en;

  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: template.subject,
    html: template.html(name, resetUrl)
  };

  try {
    // In development, display URL in console
    console.log('📧 [DEV] Password reset email would be sent to:', email);
    console.log('🔗 [DEV] Reset URL:', resetUrl);
    console.log('🌍 [DEV] Using locale:', locale);

    // Try to send email with retries
    await sendMailWithRetry(mailOptions);
    console.log(`📧 Password reset email sent to ${email}`);
  } catch (err) {
    console.error('Failed to send password reset email after retries:', err);
    // In development, don't fail the request if email sending fails
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
  }
}

/**
 * Send a map invitation email
 * @param {string} to - Recipient email
 * @param {string} inviterName - Name of the person sending the invitation
 * @param {string} mapName - Name of the map
 * @param {string} role - Role being offered
 * @param {string} token - Invitation token
 * @param {string} locale - User's preferred language (en/fr)
 */
async function sendMapInvitationEmail(to, inviterName, mapName, role, token, locale = 'en') {
  const acceptUrl = `${process.env.FRONTEND_URL}/invitations/accept/${token}`;
  const rejectUrl = `${process.env.FRONTEND_URL}/invitations/reject/${token}`;
  const template = mapInvitationTemplates[locale] || mapInvitationTemplates.en;

  const mailOptions = {
    from: '"WayPoint" <no-reply@waypoint.app>',
    to,
    subject: template.subject,
    html: template.html(inviterName, mapName, role, acceptUrl, rejectUrl)
  };

  try {
    // In development, display URLs in console
    console.log('📧 [DEV] Map invitation email would be sent to:', to);
    console.log('🔗 [DEV] Accept URL:', acceptUrl);
    console.log('🔗 [DEV] Reject URL:', rejectUrl);

    await sendMailWithRetry(mailOptions);
    console.log(`📧 Map invitation email sent to ${to}`);
  } catch (err) {
    console.error('Failed to send map invitation email:', err);
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
  }
}

/**
 * Send an invitation response email to the inviter
 * @param {string} to - Inviter's email
 * @param {string} inviteeName - Name of the person who responded
 * @param {string} mapName - Name of the map
 * @param {string} status - Response status (accepted/rejected)
 * @param {string} locale - User's preferred language (en/fr)
 */
async function sendInvitationResponseEmail(to, inviteeName, mapName, status, locale = 'en') {
  const template = invitationResponseTemplates[locale] || invitationResponseTemplates.en;

  const mailOptions = {
    from: '"WayPoint" <no-reply@waypoint.app>',
    to,
    subject: template.subject(status),
    html: template.html(inviteeName, mapName, status)
  };

  try {
    // In development, display info in console
    console.log(`📧 [DEV] Invitation response email would be sent to: ${to}`);
    console.log(`📧 [DEV] Status: ${status}`);

    await sendMailWithRetry(mailOptions);
    console.log(`📧 Invitation response email sent to ${to}`);
  } catch (err) {
    console.error('Failed to send invitation response email:', err);
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendMapInvitationEmail,
  sendInvitationResponseEmail
};
