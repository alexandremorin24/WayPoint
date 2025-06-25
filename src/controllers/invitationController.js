const MapInvitationModel = require('../models/MapInvitationModel');
const MapModel = require('../models/MapModel');
const UserModel = require('../models/UserModel');
const { sendMapInvitationEmail, sendInvitationResponseEmail } = require('../utils/mailer');
const jwt = require('jsonwebtoken');
const { ROLES } = require('../models/roles');
const db = require('../utils/db');

/**
 * Send a map invitation
 */
async function sendInvitation(req, res) {
  try {
    const { mapId } = req.params;
    const { email, role } = req.body;
    const inviterId = req.user.id;

    // Validate role
    if (!role || !ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Verify that the inviter is the map owner
    const map = await MapModel.findMapById(mapId);
    if (!map) {
      return res.status(404).json({ error: 'Map not found' });
    }
    if (map.ownerId !== inviterId) {
      return res.status(403).json({ error: 'Only the map owner can send invitations' });
    }

    // Check if there's already a pending invitation
    const existingInvitation = await MapInvitationModel.checkExistingInvitation(mapId, email);
    if (existingInvitation) {
      return res.status(400).json({ error: 'An invitation is already pending for this email' });
    }

    // Create the invitation
    const invitation = await MapInvitationModel.createInvitation({
      mapId,
      inviterId,
      inviteeEmail: email,
      role
    });

    // Send the invitation email
    await sendMapInvitationEmail(
      email,
      req.user.display_name,
      map.name,
      role,
      invitation.token,
      req.user.preferred_language
    );

    res.status(201).json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
}

/**
 * Check invitation token validity and return invitation details
 */
async function checkInvitationToken(req, res) {
  try {
    const { token } = req.params;

    const invitation = await MapInvitationModel.findInvitationByToken(token);
    if (!invitation) {
      return res.status(404).json({ error: 'Invalid or expired invitation' });
    }

    // Check if the email already has an account
    const existingUser = await UserModel.findUserByEmail(invitation.invitee_email);

    res.json({
      invitation: {
        mapName: invitation.map_name,
        inviterName: invitation.inviter_name,
        email: invitation.invitee_email,
        role: invitation.role
      },
      hasAccount: !!existingUser
    });
  } catch (error) {
    console.error('Error checking invitation:', error);
    res.status(500).json({ error: 'Failed to check invitation' });
  }
}

/**
 * Handle invitation response (accept/reject) with optional account creation
 */
async function handleInvitationResponse(req, res) {
  try {
    const { token } = req.params;
    const { action, registrationData } = req.body; // registrationData is optional

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Find and validate the invitation
    const invitation = await MapInvitationModel.findInvitationByToken(token);
    if (!invitation) {
      return res.status(404).json({ error: 'Invalid or expired invitation' });
    }

    // If accepting, we need to handle user creation/verification
    if (action === 'accept') {
      let userId;
      let existingUser;

      // Check if user exists
      existingUser = await UserModel.findUserByEmail(invitation.invitee_email);

      if (existingUser) {
        // If user exists, they must be logged in
        if (!req.user || req.user.email !== invitation.invitee_email) {
          return res.status(403).json({
            error: 'You must be logged in with the invited email address to accept this invitation'
          });
        }
        userId = existingUser.id;
      } else {
        // Create new user if registration data is provided
        if (!registrationData) {
          return res.status(400).json({
            error: 'Registration data required for new account'
          });
        }

        // Validate registration data
        if (!registrationData.displayName || !registrationData.password) {
          return res.status(400).json({
            error: 'Display name and password are required'
          });
        }

        // Create the user account
        const newUser = await UserModel.createUser({
          email: invitation.invitee_email,
          passwordHash: registrationData.password, // Note: Hash this in the actual implementation
          displayName: registrationData.displayName,
          emailVerified: true // Auto-verify since we know they got the invitation email
        });
        userId = newUser.id;

        // Log the user in by generating a token
        const token = jwt.sign(
          { id: userId, email: invitation.invitee_email },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        // Add token to response
        res.setHeader('X-Auth-Token', token);
      }

      // Add the user role to the map
      await MapModel.addRole(invitation.map_id, userId, invitation.role);
    }

    // Update invitation status
    const status = action === 'accept' ? 'accepted' : 'rejected';
    await MapInvitationModel.updateInvitationStatus(token, status);

    // Get inviter details for the response email
    const inviter = await UserModel.findUserById(invitation.inviter_id);

    // Send response email to the inviter
    if (inviter) {
      try {
        await sendInvitationResponseEmail(
          inviter.email,
          existingUser ? existingUser.display_name : (registrationData ? registrationData.displayName : ''),
          invitation.map_name,
          status,
          inviter.preferred_language
        );
      } catch (error) {
        console.error('Error sending response email:', error);
        // Continue execution even if email fails
      }
    }

    res.json({
      message: `Invitation ${status} successfully`,
      redirectTo: action === 'accept' ? `/maps/${invitation.map_id}` : '/'
    });
  } catch (error) {
    console.error('Error handling invitation response:', error);
    res.status(500).json({ error: 'Failed to process invitation response' });
  }
}

/**
 * Clean up expired invitations
 */
async function cleanupInvitations(req, res) {
  try {
    await MapInvitationModel.cleanupExpiredInvitations();
    res.json({ message: 'Expired invitations cleaned up successfully' });
  } catch (error) {
    console.error('Error cleaning up invitations:', error);
    res.status(500).json({ error: 'Failed to clean up invitations' });
  }
}

/**
 * Get pending invitations for a map
 */
async function getPendingMapInvitations(req, res) {
  try {
    const { mapId } = req.params;
    console.log('Getting invitations for map:', mapId);
    console.log('User:', req.user);

    // Verify that the requester is the map owner
    const map = await MapModel.findMapById(mapId);
    console.log('Found map:', map);

    if (!map) {
      console.log('Map not found');
      return res.status(404).json({ error: 'Map not found' });
    }

    if (map.ownerId !== req.user.id) {
      console.log('Access denied. Map owner:', map.ownerId, 'User:', req.user.id);
      return res.status(403).json({ error: 'Only the map owner can view invitations' });
    }

    console.log('Getting pending invitations');
    const invitations = await MapInvitationModel.getPendingInvitationsForMap(mapId);
    console.log('Found invitations:', invitations);
    res.json(invitations);
  } catch (error) {
    console.error('Detailed error in getPendingMapInvitations:', {
      error: error.message,
      stack: error.stack,
      mapId: req.params.mapId,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'Failed to get invitations' });
  }
}

/**
 * Get pending invitations for the current user
 */
async function getUserInvitations(req, res) {
  try {
    const invitations = await MapInvitationModel.getPendingInvitationsForUser(req.user.email);
    res.json(invitations);
  } catch (error) {
    console.error('Error getting user invitations:', error);
    res.status(500).json({ error: 'Failed to get invitations' });
  }
}

/**
 * Cancel a pending invitation
 */
async function cancelInvitation(req, res) {
  try {
    const { invitationId } = req.params;

    // Verify that the invitation exists and is pending
    const [rows] = await db.execute(
      `SELECT i.*, m.owner_id 
       FROM map_invitations i
       JOIN maps m ON i.map_id = m.id
       WHERE i.id = ? AND i.status = 'pending'`,
      [invitationId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found or already processed' });
    }

    const invitation = rows[0];

    // Verify that the user is the map owner
    if (invitation.owner_id !== req.user.id) {
      return res.status(404).json({ error: 'Invitation not found or already processed' });
    }

    const cancelled = await MapInvitationModel.cancelInvitation(invitationId, invitation.inviter_id);

    if (!cancelled) {
      return res.status(404).json({ error: 'Invitation not found or already processed' });
    }

    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({ error: 'Failed to cancel invitation' });
  }
}

module.exports = {
  sendInvitation,
  handleInvitationResponse,
  checkInvitationToken,
  cleanupInvitations,
  getPendingMapInvitations,
  getUserInvitations,
  cancelInvitation
}; 
