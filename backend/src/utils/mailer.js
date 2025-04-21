const nodemailer = require('nodemailer');

// Setup email transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT), // 587 for TLS, 465 for SSL
  secure: false, // Mailtrap uses STARTTLS on port 587
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Send a verification email with a secure tokenized link.
 * @param {string} to - Recipient email
 * @param {string} token - JWT token for email verification
 */
async function sendVerificationEmail(to, token) {
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
      <p>If the button doesn’t work, you can also copy and paste this URL into your browser:</p>
      <p>${verifyUrl}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Verification email sent to ${to}`);
    console.log(`🔗 ${verifyUrl}`);
  } catch (err) {
    console.error('Failed to send verification email:', err);
  }
}

module.exports = { sendVerificationEmail };
