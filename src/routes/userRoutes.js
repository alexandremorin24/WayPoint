const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const { findUserById } = require('../models/UserModel');
const multer = require('multer');
const userController = require('../controllers/userController');
const db = require('../utils/db');

// Multer config for avatar upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  // No file size limit for avatar uploads
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Invalid image file. Only JPEG, PNG and WebP images are allowed.'), false);
    }
    cb(null, true);
  }
});

// Get user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);

    if (!user || !user.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      photoUrl: user.photo_url,
      emailVerified: user.email_verified === 1,
      preferredLanguage: user.preferred_language,
      emailOptin: user.email_optin === 1,
      createdAt: user.created_at
    });
  } catch (err) {
    console.error('GET /me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile (without file upload)
router.put('/me', requireAuth, express.json(), userController.updateMe);

// Upload avatar (with file upload)
router.put('/me/avatar', requireAuth, upload.single('avatar'), userController.uploadAvatar);

// Search users
router.get('/search', requireAuth, userController.searchUsers);

// Get user statistics
router.get('/me/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total maps created by user
    const [mapsResult] = await db.execute(
      'SELECT COUNT(*) as total FROM maps WHERE owner_id = ?',
      [userId]
    );

    // Get public maps created by user
    const [publicMapsResult] = await db.execute(
      'SELECT COUNT(*) as total FROM maps WHERE owner_id = ? AND is_public = true',
      [userId]
    );

    // Get shared maps (where user has a role)
    const [sharedMapsResult] = await db.execute(
      'SELECT COUNT(*) as total FROM map_user_roles WHERE user_id = ?',
      [userId]
    );

    // Get total POIs created by user
    const [poisResult] = await db.execute(
      'SELECT COUNT(*) as total FROM pois WHERE creator_id = ?',
      [userId]
    );

    // Get votes given by user
    const [votesResult] = await db.execute(
      'SELECT COUNT(*) as total FROM map_votes WHERE user_id = ?',
      [userId]
    );

    // Get invitations sent by user
    const [invitationsResult] = await db.execute(
      'SELECT COUNT(*) as total FROM map_invitations WHERE inviter_id = ?',
      [userId]
    );

    // Get categories created (approximation via maps owned)
    const [categoriesResult] = await db.execute(
      `SELECT COUNT(*) as total FROM categories c 
       JOIN maps m ON c.map_id = m.id 
       WHERE m.owner_id = ?`,
      [userId]
    );

    const stats = {
      totalMaps: mapsResult[0].total,
      publicMaps: publicMapsResult[0].total,
      sharedMaps: sharedMapsResult[0].total,
      totalPois: poisResult[0].total,
      votes: votesResult[0].total,
      invitationsSent: invitationsResult[0].total,
      categoriesCreated: categoriesResult[0].total
    };

    res.json(stats);
  } catch (err) {
    console.error('GET /me/stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Multer error handler middleware (must be after all routes)
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'Invalid image file. Only JPEG, PNG and WebP images are allowed.' });
  }
  if (err && err.message && err.message.includes('Invalid image file')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
