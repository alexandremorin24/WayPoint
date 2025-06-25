const request = require('supertest');
const app = require('../../app');
const db = require('../../src/utils/db');
const { createUser, updateUserEmailVerified } = require('../../src/models/UserModel');
const path = require('path');
const jwt = require('jsonwebtoken');
const { getTestImagePath } = require('../utils/test-utils');

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('🤝 Map Invitations Management', () => {
  let owner, invitedUser, otherUser, mapId;
  let tokenOwner, tokenInvited, tokenOther;
  const testGame = 'InvitationsTestGame';
  const ownerEmail = 'owner-invitations@example.com';
  const invitedEmail = 'invited-user@example.com';
  const otherEmail = 'other-user@example.com';

  beforeAll(async () => {
    // Cleanup test data
    await db.execute('DELETE FROM map_invitations WHERE invitee_email IN (?, ?, ?)', [ownerEmail, invitedEmail, otherEmail]);
    await db.execute('DELETE FROM map_user_roles WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['Invitations Test Map']);
    await db.execute('DELETE FROM maps WHERE name = ?', ['Invitations Test Map']);
    await db.execute('DELETE FROM users WHERE email IN (?, ?, ?)', [ownerEmail, invitedEmail, otherEmail]);
    await db.execute('DELETE FROM games WHERE id = ?', [testGame]);

    // Create test game
    await db.execute(
      'INSERT INTO games (id, name, slug) VALUES (?, ?, ?)',
      [testGame, testGame, testGame.toLowerCase()]
    );

    // Create users with verified emails
    owner = await createUser({ email: ownerEmail, passwordHash: 'hash', displayName: 'Owner' });
    await updateUserEmailVerified(owner.id);

    invitedUser = await createUser({ email: invitedEmail, passwordHash: 'hash', displayName: 'Invited User' });
    await updateUserEmailVerified(invitedUser.id);

    otherUser = await createUser({ email: otherEmail, passwordHash: 'hash', displayName: 'Other User' });
    await updateUserEmailVerified(otherUser.id);

    tokenOwner = generateToken(owner);
    tokenInvited = generateToken(invitedUser);
    tokenOther = generateToken(otherUser);
  });

  beforeEach(async () => {
    // Reset test data before each test
    await db.execute('DELETE FROM map_invitations WHERE invitee_email IN (?, ?, ?)', [ownerEmail, invitedEmail, otherEmail]);
    await db.execute('DELETE FROM map_user_roles WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['Invitations Test Map']);
    await db.execute('DELETE FROM maps WHERE name = ?', ['Invitations Test Map']);

    // Create test map
    const imagePath = await getTestImagePath('test-image');
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .field('name', 'Invitations Test Map')
      .field('description', 'A map for testing invitations')
      .field('gameName', testGame)
      .field('isPublic', 'false')
      .attach('image', imagePath);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    mapId = res.body.id;
    expect(mapId).toBeDefined();
  });

  afterAll(async () => {
    // Final cleanup
    await db.execute('DELETE FROM map_invitations WHERE invitee_email IN (?, ?, ?)', [ownerEmail, invitedEmail, otherEmail]);
    await db.execute('DELETE FROM map_user_roles WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['Invitations Test Map']);
    await db.execute('DELETE FROM maps WHERE name = ?', ['Invitations Test Map']);
    await db.execute('DELETE FROM users WHERE email IN (?, ?, ?)', [ownerEmail, invitedEmail, otherEmail]);
    await db.execute('DELETE FROM games WHERE id = ?', [testGame]);
  });

  describe('POST /api/backend/maps/:mapId/invitations', () => {
    it('should allow owner to send an invitation', async () => {
      const res = await request(app)
        .post(`/api/backend/maps/${mapId}/invitations`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          email: invitedEmail,
          role: 'editor_all'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message', 'Invitation sent successfully');
    });

    it('should prevent non-owner from sending invitations', async () => {
      const res = await request(app)
        .post(`/api/backend/maps/${mapId}/invitations`)
        .set('Authorization', `Bearer ${tokenOther}`)
        .send({
          email: invitedEmail,
          role: 'editor_all'
        });

      expect(res.statusCode).toBe(403);
    });

    it('should prevent duplicate invitations', async () => {
      // Send first invitation
      await request(app)
        .post(`/api/backend/maps/${mapId}/invitations`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          email: invitedEmail,
          role: 'editor_all'
        });

      // Try to send duplicate invitation
      const res = await request(app)
        .post(`/api/backend/maps/${mapId}/invitations`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          email: invitedEmail,
          role: 'editor_all'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'An invitation is already pending for this email');
    });

    it('should reject invalid roles', async () => {
      const res = await request(app)
        .post(`/api/backend/maps/${mapId}/invitations`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          email: invitedEmail,
          role: 'invalid_role'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/backend/maps/:mapId/invitations', () => {
    beforeEach(async () => {
      // Create some test invitations
      await request(app)
        .post(`/api/backend/maps/${mapId}/invitations`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          email: invitedEmail,
          role: 'editor_all'
        });
    });

    it('should allow owner to list pending invitations', async () => {
      const res = await request(app)
        .get(`/api/backend/maps/${mapId}/invitations`)
        .set('Authorization', `Bearer ${tokenOwner}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('invitee_email', invitedEmail);
    });

    it('should prevent non-owner from listing invitations', async () => {
      const res = await request(app)
        .get(`/api/backend/maps/${mapId}/invitations`)
        .set('Authorization', `Bearer ${tokenOther}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/backend/invitations/me', () => {
    let invitationToken;

    beforeEach(async () => {
      // Create an invitation and capture its token
      const res = await request(app)
        .post(`/api/backend/maps/${mapId}/invitations`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          email: invitedEmail,
          role: 'editor_all'
        });

      // Get the token from the database
      const [rows] = await db.execute(
        'SELECT token FROM map_invitations WHERE invitee_email = ? AND status = "pending" LIMIT 1',
        [invitedEmail]
      );
      invitationToken = rows[0].token;
    });

    it('should list pending invitations for the current user', async () => {
      const res = await request(app)
        .get('/api/backend/invitations/me')
        .set('Authorization', `Bearer ${tokenInvited}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('invitee_email', invitedEmail);
    });

    it('should not show expired or processed invitations', async () => {
      // Accept the invitation
      await request(app)
        .post(`/api/backend/invitations/${invitationToken}/response`)
        .set('Authorization', `Bearer ${tokenInvited}`)
        .send({ action: 'accept' });

      const res = await request(app)
        .get('/api/backend/invitations/me')
        .set('Authorization', `Bearer ${tokenInvited}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });
  });

  describe('POST /api/backend/invitations/:token/response', () => {
    let invitationToken;

    beforeEach(async () => {
      // Create an invitation and capture its token
      await request(app)
        .post(`/api/backend/maps/${mapId}/invitations`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          email: invitedEmail,
          role: 'editor_all'
        });

      // Get the token from the database
      const [rows] = await db.execute(
        'SELECT token FROM map_invitations WHERE invitee_email = ? AND status = "pending" LIMIT 1',
        [invitedEmail]
      );
      invitationToken = rows[0].token;
    });

    it('should allow accepting an invitation', async () => {
      const res = await request(app)
        .post(`/api/backend/invitations/${invitationToken}/response`)
        .set('Authorization', `Bearer ${tokenInvited}`)
        .send({ action: 'accept' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Invitation accepted successfully');

      // Verify role was assigned
      const [roles] = await db.execute(
        'SELECT role FROM map_user_roles WHERE map_id = ? AND user_id = ?',
        [mapId, invitedUser.id]
      );
      expect(roles.length).toBe(1);
      expect(roles[0].role).toBe('editor_all');
    });

    it('should allow rejecting an invitation', async () => {
      const res = await request(app)
        .post(`/api/backend/invitations/${invitationToken}/response`)
        .set('Authorization', `Bearer ${tokenInvited}`)
        .send({ action: 'reject' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Invitation rejected successfully');

      // Verify no role was assigned
      const [roles] = await db.execute(
        'SELECT role FROM map_user_roles WHERE map_id = ? AND user_id = ?',
        [mapId, invitedUser.id]
      );
      expect(roles.length).toBe(0);
    });

    it('should prevent using an invalid token', async () => {
      const res = await request(app)
        .post('/api/backend/invitations/invalid-token/response')
        .set('Authorization', `Bearer ${tokenInvited}`)
        .send({ action: 'accept' });

      expect(res.statusCode).toBe(404);
    });

    it('should prevent using an already processed invitation', async () => {
      // Accept the invitation first
      await request(app)
        .post(`/api/backend/invitations/${invitationToken}/response`)
        .set('Authorization', `Bearer ${tokenInvited}`)
        .send({ action: 'accept' });

      // Try to accept it again
      const res = await request(app)
        .post(`/api/backend/invitations/${invitationToken}/response`)
        .set('Authorization', `Bearer ${tokenInvited}`)
        .send({ action: 'accept' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/backend/invitations/:invitationId', () => {
    let invitationId;

    beforeEach(async () => {
      // Create an invitation and capture its ID
      await request(app)
        .post(`/api/backend/maps/${mapId}/invitations`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          email: invitedEmail,
          role: 'editor_all'
        });

      // Get the ID from the database
      const [rows] = await db.execute(
        'SELECT id FROM map_invitations WHERE invitee_email = ? AND status = "pending" LIMIT 1',
        [invitedEmail]
      );
      invitationId = rows[0].id;
    });

    it('should allow owner to cancel an invitation', async () => {
      const res = await request(app)
        .delete(`/api/backend/invitations/${invitationId}`)
        .set('Authorization', `Bearer ${tokenOwner}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Invitation cancelled successfully');

      // Verify invitation was cancelled
      const [invitations] = await db.execute(
        'SELECT status FROM map_invitations WHERE id = ?',
        [invitationId]
      );
      expect(invitations[0].status).toBe('cancelled');
    });

    it('should prevent non-owner from cancelling invitations', async () => {
      const res = await request(app)
        .delete(`/api/backend/invitations/${invitationId}`)
        .set('Authorization', `Bearer ${tokenOther}`);

      expect(res.statusCode).toBe(404);
    });

    it('should handle non-existent invitations', async () => {
      const res = await request(app)
        .delete('/api/backend/invitations/non-existent-id')
        .set('Authorization', `Bearer ${tokenOwner}`);

      expect(res.statusCode).toBe(404);
    });
  });
}); 
