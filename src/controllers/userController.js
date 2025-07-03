const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const { validatePassword, validateEmail } = require('../utils/validation');

/**
 * Update user profile
 */
exports.updateMe = async (req, res) => {
  const userId = req.user.id;
  const { email, currentPassword, newPassword, confirmPassword, displayName, emailOptin, preferredLanguage } = req.body;

  try {
    // Get current user data
    const [rows] = await db.execute(
      'SELECT email, password_hash FROM users WHERE id = ?',
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = rows[0];

    // If updating email or password, verify current password
    if (email || newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password required' });
      }
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    // Update email
    if (email) {
      // Validate email format
      if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Check if email is already in use
      const [existingUsers] = await db.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email.toLowerCase(), userId]
      );
      if (existingUsers.length > 0) {
        return res.status(409).json({ error: 'Email already in use' });
      }

      await db.execute(
        'UPDATE users SET email = ?, email_verified = false WHERE id = ?',
        [email.toLowerCase(), userId]
      );
    }

    // Update password
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }

      // Validate password strength
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ error: passwordValidation.error });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await db.execute(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [passwordHash, userId]
      );
    }


    // Update email optin
    if (emailOptin !== undefined) {
      await db.execute(
        'UPDATE users SET email_optin = ? WHERE id = ?',
        [emailOptin ? 1 : 0, userId]
      );
    }

    // Update preferred language
    if (preferredLanguage) {
      if (!['en', 'fr'].includes(preferredLanguage)) {
        return res.status(400).json({ error: 'Invalid language selection' });
      }
      await db.execute(
        'UPDATE users SET preferred_language = ? WHERE id = ?',
        [preferredLanguage, userId]
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Upload avatar
 */
exports.uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid image file. Only JPEG, PNG and WebP images are allowed.' });
    }

    // Process image
    const image = sharp(req.file.buffer);
    const metadata = await image.metadata();

    // No dimension validation - we'll resize any image to 200x200

    // Ensure avatars directory exists
    const avatarsDir = path.join(__dirname, '../../public/uploads/avatars');
    fs.mkdirSync(avatarsDir, { recursive: true });

    // Filename based on user id
    const filename = `user-${req.user.id}.webp`;
    const filepath = path.join(avatarsDir, filename);

    // Remove previous avatar if it exists
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (err) {
      // Ignore error if file does not exist
    }

    // Convert to WebP and save
    await image
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(filepath);

    // Verify file exists after save
    if (!fs.existsSync(filepath)) {
      throw new Error('Failed to save avatar file');
    }

    // Update user's photo_url in database
    const photoUrl = `/uploads/avatars/${filename}`;
    await db.execute(
      'UPDATE users SET photo_url = ? WHERE id = ?',
      [photoUrl, req.user.id]
    );

    res.json({
      message: 'Avatar uploaded successfully',
      photoUrl
    });
  } catch (err) {
    console.error('[ERROR] Avatar upload failed:', err);
    if (err.message.includes('image')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to process image' });
  }
};

/**
 * Search users by display name or email
 */
exports.searchUsers = async (req, res) => {
  const { q, includeSelf } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters long' });
  }

  try {
    const searchTerm = q.toLowerCase();

    // Si includeSelf=true, on n'exclut pas l'utilisateur actuel (utile pour l'enrichissement des invitations)
    let query, params;
    if (includeSelf === 'true') {
      query = `SELECT id, email, display_name, photo_url FROM users WHERE 
               (LOWER(email) = ? OR LOWER(display_name) LIKE ?) 
               LIMIT 10`;
      params = [searchTerm, `%${searchTerm}%`];
    } else {
      // Comportement par défaut : exclure l'utilisateur actuel
      query = `SELECT id, email, display_name, photo_url FROM users WHERE 
               (LOWER(email) = ? OR LOWER(display_name) LIKE ?) 
               AND id != ? LIMIT 10`;
      params = [searchTerm, `%${searchTerm}%`, req.user.id];
    }

    console.log(`🔍 Search query: ${query}`);
    console.log(`🔍 Search params:`, params);

    const [users] = await db.execute(query, params);

    console.log(`🔍 Search results for "${q}":`, users);

    res.json(users);
  } catch (err) {
    console.error('Error searching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 
