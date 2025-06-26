const MapInvitationModel = require('../models/MapInvitationModel');
const MapModel = require('../models/MapModel');
const UserModel = require('../models/UserModel');
const { sendMapInvitationEmail, sendInvitationResponseEmail } = require('../utils/mailer');
const jwt = require('jsonwebtoken');
const { ROLES, getRolePermissions } = require('../models/roles');
const db = require('../utils/db');
const bcrypt = require('bcrypt');

/**
 * Send a map invitation
 */
async function sendInvitation(req, res) {
  try {
    const { mapId } = req.params;
    const { role, email } = req.body;
    const inviterId = req.user.id;

    // Validate role
    if (!role || !ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Validate email
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
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

    // Log invitation link for testing
    console.log('\n=== INVITATION LINK FOR TESTING ===');
    // Utiliser la langue préférée de l'invité ou 'en' par défaut
    const [inviteeRows] = await db.execute(
      `SELECT preferred_language FROM users WHERE email = ?`,
      [email]
    );
    const lang = inviteeRows?.[0]?.preferred_language || 'en';
    console.log(`${process.env.FRONTEND_URL}/${lang}/invitations/${invitation.token}`);
    console.log('===================================\n');

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
    res.status(500).json({ error: error.message });
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
      return res.status(404).json({
        error: 'Invitation not found',
        code: 'INVITATION_NOT_FOUND'
      });
    }

    // Build the response
    const response = {
      invitation: {
        status: invitation.status,
        inviterName: invitation.inviter_name,
        mapName: invitation.map_name,
        gameName: invitation.game_name,
        gameId: invitation.game_id,
        mapId: invitation.map_id,
        role: invitation.role,
        email: invitation.invitee_email,
        expiresAt: invitation.expires_at,
        updatedAt: invitation.updated_at || invitation.created_at
      }
    };

    // Check if the invitation is still valid
    const isValid = await MapInvitationModel.isInvitationValid(invitation);
    if (isValid) {
      response.invitation.canAccept = true;
      response.invitation.permissions = getRolePermissions(invitation.role);

      // Simplified authentication logic
      if (req.user) {
        if (req.user.email.toLowerCase() === invitation.invitee_email.toLowerCase()) {
          // Connected with the correct account
          response.authStatus = 'ready';
        } else {
          // Connected with the wrong account
          response.authStatus = 'wrong_account';
          response.currentUserEmail = req.user.email;
        }
      } else {
        // Not connected
        response.authStatus = 'needs_auth';

        // Check if the user already has an account
        const existingUser = await UserModel.findUserByEmail(invitation.invitee_email);
        response.hasAccount = !!existingUser;
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Error checking invitation:', error);
    res.status(500).json({
      error: 'Failed to check invitation',
      code: 'INVITATION_CHECK_FAILED'
    });
  }
}

/**
 * Handle invitation response (accept/reject) with optional account creation
 */
async function handleInvitationResponse(req, res) {
  try {
    const { token } = req.params;
    const { action, registrationData } = req.body;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        error: 'Invalid action',
        code: 'INVALID_ACTION'
      });
    }

    // Find and validate the invitation
    const invitation = await MapInvitationModel.findInvitationByToken(token);
    if (!invitation) {
      return res.status(404).json({
        error: 'Invitation not found',
        code: 'INVITATION_NOT_FOUND'
      });
    }

    // Check if the invitation has already been processed
    if (invitation.status === 'accepted' || invitation.status === 'rejected') {
      return res.status(400).json({
        error: `Cette invitation a déjà été ${invitation.status === 'accepted' ? 'acceptée' : 'refusée'}`,
        code: 'INVITATION_ALREADY_PROCESSED'
      });
    }

    // Check if the invitation is expired or cancelled
    if (invitation.status === 'expired' || invitation.status === 'cancelled' || new Date(invitation.expires_at) <= new Date()) {
      return res.status(400).json({
        error: 'Cette invitation n\'est plus valide',
        code: 'INVITATION_INVALID'
      });
    }

    // Check the connection state
    const existingUser = await UserModel.findUserByEmail(invitation.invitee_email);
    let newUser = null;

    if (existingUser) {
      // If the user exists, they must be connected with the correct account
      if (!req.user || req.user.email.toLowerCase() !== invitation.invitee_email.toLowerCase()) {
        return res.status(403).json({
          error: 'You must be logged in with the invited email address to accept this invitation',
          code: 'WRONG_USER'
        });
      }
    } else if (action === 'accept') {
      // Account creation is required to accept
      if (!registrationData) {
        return res.status(400).json({
          error: 'Registration data required for new account',
          code: 'REGISTRATION_REQUIRED'
        });
      }

      // Validate registration data
      if (!registrationData.displayName || !registrationData.password) {
        return res.status(400).json({
          error: 'Display name and password are required',
          code: 'INVALID_REGISTRATION_DATA'
        });
      }

      try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(registrationData.password, salt);

        // Create the account
        newUser = await UserModel.createUser({
          email: invitation.invitee_email,
          passwordHash,
          displayName: registrationData.displayName,
          emailVerified: true,
          preferredLanguage: req.query.lang || 'en'
        });

        // Generate the connection token
        const authToken = jwt.sign(
          { id: newUser.id, email: invitation.invitee_email },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        res.setHeader('X-Auth-Token', authToken);
      } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({
          error: 'Failed to create user account',
          code: 'USER_CREATION_FAILED'
        });
      }
    }

    try {
      // Update the invitation status
      const status = action === 'accept' ? 'accepted' : 'rejected';
      await MapInvitationModel.updateInvitationStatus(token, status);

      // Add the role if accepted
      if (action === 'accept') {
        const userId = existingUser ? existingUser.id : newUser.id;
        await MapModel.addRole(invitation.map_id, userId, invitation.role);
      }

      // Send the response email
      const inviter = await UserModel.findUserById(invitation.inviter_id);
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
        }
      }

      // Determine the language for the redirection
      const userLang = (
        req.user?.preferred_language ||
        existingUser?.preferred_language ||
        req.query.lang ||
        'en'
      );

      res.json({
        message: `Invitation ${status} successfully`,
        redirectTo: action === 'accept' ? `/${userLang}/maps/${invitation.game_id}/${invitation.map_id}` : `/${userLang}/`,
        status
      });
    } catch (error) {
      console.error('Error handling invitation response:', error);
      res.status(500).json({
        error: 'Failed to process invitation response',
        code: 'INVITATION_RESPONSE_FAILED'
      });
    }
  } catch (error) {
    console.error('Error handling invitation response:', error);
    res.status(500).json({
      error: 'Failed to process invitation response',
      code: 'INVITATION_RESPONSE_FAILED'
    });
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
