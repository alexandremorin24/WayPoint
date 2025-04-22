const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { createUser, findUserByEmail, updateUserEmailVerified, findUserByDisplayName } = require('../models/UserModel');
const { sendVerificationEmail } = require('../utils/mailer');
const validator = require('validator');


// 🔐 [POST] /api/register
async function registerUser(req, res) {
  const { email, password, confirmPassword, displayName } = req.body;

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'Email, password and displayName are required' });
  }

  // Validate email
  const normalizedEmail = email.trim().toLowerCase();

  if (!validator.isEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  try {
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Validate displayName
    if (displayName.length < 3 || displayName.length > 20) {
      return res.status(400).json({ error: 'Display name must be between 3 and 20 characters.' });
    }

    if (!/^[a-zA-Z0-9]+$/.test(displayName)) {
      return res.status(400).json({ error: 'Display name must only contain letters and numbers.' });
    }

    const forbiddenNames = ['admin', 'root', 'moderator', 'support'];
    if (forbiddenNames.includes(displayName.toLowerCase())) {
      return res.status(400).json({ error: 'This display name is reserved.' });
    }

    const existingDisplayName = await findUserByDisplayName(displayName);
    if (existingDisplayName) {
      return res.status(409).json({ error: 'This display name is already taken.' });
    }

    // Validate password
    if (!validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    })) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long and include uppercase, lowercase, number and symbol.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await createUser({
      email: normalizedEmail,
      passwordHash,
      displayName
    });

    const token = jwt.sign({ email: normalizedEmail }, process.env.JWT_SECRET, { expiresIn: '1d' });
    await sendVerificationEmail(normalizedEmail, token);

    console.log(`[DEV] Use this link to verify manually:`);
    console.log(`http://localhost:3000/api/verify-email?token=${token}`);

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName
      }
    });

  } catch (err) {
    console.error('Error registerUser :', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


// 🔐 [POST] /api/login
async function loginUser(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.email_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name
      }
    });


  } catch (err) {
    console.error('Login Error :', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 🔐 [GET] /api/verify-email?token=xxx
async function verifyEmail(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  try {
    const user = await findUserByEmail(decoded.email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email_verified) {
      return res.status(200).json({ message: 'Email already verified' });
    }

    await updateUserEmailVerified(user.id);

    return res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);

  } catch (err) {
    console.error('verifyEmail Error :', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
};
