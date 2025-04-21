const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/authMiddleware');
const { findUserById } = require('../models/UserModel');

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      id: user.id,
      email: user.email,
      displayName: user.display_name
    });
  } catch (err) {
    console.error('GET /me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
