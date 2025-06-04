const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/authMiddleware');
const { findUserById } = require('../models/UserModel');
const multer = require('multer');
const userController = require('../controllers/userController');

// Multer config for avatar upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
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

// Multer error handler middleware (must be after all routes)
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Image is too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: 'Invalid image file. Only JPEG, PNG and WebP images are allowed.' });
  }
  if (err && err.message && err.message.includes('Invalid image file')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
