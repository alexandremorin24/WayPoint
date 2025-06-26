const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const invitationController = require('../controllers/invitationController');
const jwt = require('jsonwebtoken');

// Optional auth middleware that sets req.user if token is present but doesn't require it
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continue without authentication
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // Ignore token verification errors for optional auth
  }
  next();
};

// Send an invitation (requires authentication)
router.post('/maps/:mapId/invitations', requireAuth, invitationController.sendInvitation);

// Get pending invitations for a map (requires authentication)
router.get('/maps/:mapId/invitations', requireAuth, invitationController.getPendingMapInvitations);

// Get pending invitations for the current user (requires authentication)
router.get('/invitations/me', requireAuth, invitationController.getUserInvitations);

// Check invitation token (public route)
router.get('/invitations/:token', optionalAuth, invitationController.checkInvitationToken);

// Handle invitation response (auth optional - will be checked in controller if needed)
router.post('/invitations/:token/response', optionalAuth, invitationController.handleInvitationResponse);

// Cancel an invitation (requires authentication)
router.delete('/invitations/:invitationId', requireAuth, invitationController.cancelInvitation);

// Cleanup expired invitations (internal use)
router.post('/invitations/cleanup', invitationController.cleanupInvitations);

module.exports = router; 
