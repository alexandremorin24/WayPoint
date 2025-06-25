const db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Create a new map invitation
 * @param {Object} invitation
 * @param {string} invitation.mapId
 * @param {string} invitation.inviterId
 * @param {string} invitation.inviteeEmail
 * @param {string} invitation.role
 * @returns {Promise<Object>}
 */
async function createInvitation({ mapId, inviterId, inviteeEmail, role }) {
  const id = uuidv4();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const [result] = await db.execute(
    `INSERT INTO map_invitations (
      id,
      map_id,
      inviter_id,
      invitee_email,
      role,
      token,
      expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, mapId, inviterId, inviteeEmail, role, token, expiresAt]
  );

  return {
    id,
    mapId,
    inviterId,
    inviteeEmail,
    role,
    token,
    expiresAt,
    status: 'pending'
  };
}

/**
 * Find an invitation by its token
 * @param {string} token
 * @returns {Promise<Object|null>}
 */
async function findInvitationByToken(token) {
  const [rows] = await db.execute(
    `SELECT i.*, m.name as map_name, u.display_name as inviter_name 
     FROM map_invitations i
     JOIN maps m ON i.map_id = m.id
     JOIN users u ON i.inviter_id = u.id
     WHERE i.token = ? AND i.status = 'pending' AND i.expires_at > NOW()
     LIMIT 1`,
    [token]
  );
  return rows[0] || null;
}

/**
 * Update invitation status
 * @param {string} token
 * @param {string} status
 * @returns {Promise<Object>}
 */
async function updateInvitationStatus(token, status) {
  if (!['pending', 'accepted', 'rejected', 'expired', 'cancelled'].includes(status)) {
    throw new Error('Invalid status');
  }

  const [result] = await db.execute(
    'UPDATE map_invitations SET status = ? WHERE token = ? AND status = "pending"',
    [status, token]
  );
  return result;
}

/**
 * Check if an invitation already exists
 * @param {string} mapId
 * @param {string} inviteeEmail
 * @returns {Promise<boolean>}
 */
async function checkExistingInvitation(mapId, inviteeEmail) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) as count 
     FROM map_invitations 
     WHERE map_id = ? AND invitee_email = ? AND status = 'pending' AND expires_at > NOW()`,
    [mapId, inviteeEmail]
  );
  return rows[0].count > 0;
}

/**
 * Clean up expired invitations
 * @returns {Promise<void>}
 */
async function cleanupExpiredInvitations() {
  await db.execute(
    "UPDATE map_invitations SET status = 'expired' WHERE status = 'pending' AND expires_at <= NOW()"
  );
}

/**
 * Get pending invitations for a map
 * @param {string} mapId
 * @returns {Promise<Array>}
 */
async function getPendingInvitationsForMap(mapId) {
  const [rows] = await db.execute(
    `SELECT i.*, COALESCE(u.display_name, 'Unknown User') as inviter_name 
     FROM map_invitations i
     LEFT JOIN users u ON i.inviter_id = u.id
     WHERE i.map_id = ? AND i.status = 'pending' AND i.expires_at > NOW()
     ORDER BY i.created_at DESC`,
    [mapId]
  );
  return rows;
}

/**
 * Get pending invitations for a user by email
 * @param {string} email
 * @returns {Promise<Array>}
 */
async function getPendingInvitationsForUser(email) {
  const [rows] = await db.execute(
    `SELECT i.*, m.name as map_name, u.display_name as inviter_name 
     FROM map_invitations i
     JOIN maps m ON i.map_id = m.id
     JOIN users u ON i.inviter_id = u.id
     WHERE i.invitee_email = ? AND i.status = 'pending' AND i.expires_at > NOW()
     ORDER BY i.created_at DESC`,
    [email]
  );
  return rows;
}

/**
 * Cancel an invitation
 * @param {string} invitationId
 * @param {string} inviterId - To verify the canceler is the inviter
 * @returns {Promise<boolean>}
 */
async function cancelInvitation(invitationId, inviterId) {
  const [result] = await db.execute(
    `UPDATE map_invitations 
     SET status = 'cancelled' 
     WHERE id = ? AND inviter_id = ? AND status = 'pending'`,
    [invitationId, inviterId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  createInvitation,
  findInvitationByToken,
  updateInvitationStatus,
  checkExistingInvitation,
  cleanupExpiredInvitations,
  getPendingInvitationsForMap,
  getPendingInvitationsForUser,
  cancelInvitation
}; 
