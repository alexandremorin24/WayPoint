const request = require('supertest');
const app = require('../../app');
const db = require('../../src/utils/db');
const { createUser, updateUserEmailVerified } = require('../../src/models/UserModel');
const MapInvitationModel = require('../../src/models/MapInvitationModel');
const jwt = require('jsonwebtoken');
const { getTestImagePath } = require('../utils/test-utils');

describe('Invitation Status Management', () => {
  let testMap;
  let owner;
  let invitee;
  let invitation;
  let ownerToken;
  const ownerEmail = 'owner@test.com';
  const inviteeEmail = 'invitee@test.com';
  const testGame = 'invitationStatusTestGame';

  beforeAll(async () => {
    // Create test game
    await db.execute(
      'INSERT INTO games (id, name, slug) VALUES (?, ?, ?)',
      [testGame, testGame, testGame.toLowerCase()]
    );
  });

  beforeEach(async () => {
    // Cleanup test data
    await db.execute('DELETE FROM map_invitations WHERE invitee_email IN (?, ?)', [ownerEmail, inviteeEmail]);
    await db.execute('DELETE FROM map_user_roles WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['Test Map']);
    await db.execute('DELETE FROM maps WHERE name = ?', ['Test Map']);
    await db.execute('DELETE FROM users WHERE email IN (?, ?)', [ownerEmail, inviteeEmail]);

    // Create test data
    owner = await createUser({
      email: ownerEmail,
      passwordHash: 'hash',
      displayName: 'Owner',
      preferredLanguage: 'en',
      authProvider: 'local'
    });
    await updateUserEmailVerified(owner.id);

    invitee = await createUser({
      email: inviteeEmail,
      passwordHash: 'hash',
      displayName: 'Invitee',
      preferredLanguage: 'en',
      authProvider: 'local'
    });
    await updateUserEmailVerified(invitee.id);

    ownerToken = jwt.sign({ id: owner.id, email: owner.email }, process.env.JWT_SECRET);

    // Create test map
    const imagePath = await getTestImagePath('test-image');
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${ownerToken}`)
      .field('name', 'Test Map')
      .field('description', 'A map for testing invitations')
      .field('gameName', testGame)
      .field('isPublic', 'false')
      .attach('image', imagePath);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    testMap = res.body;

    // Verify that the map was created
    const [maps] = await db.execute(
      'SELECT * FROM maps WHERE id = ?',
      [testMap.id]
    );
    expect(maps.length).toBe(1);
    expect(maps[0].name).toBe('Test Map');

    // Verify that the game exists
    const [games] = await db.execute(
      'SELECT * FROM games WHERE id = ?',
      [testGame]
    );
    expect(games.length).toBe(1);
    expect(games[0].name).toBe(testGame);
  });

  afterEach(async () => {
    // Cleanup test data
    await db.execute('DELETE FROM map_invitations WHERE invitee_email IN (?, ?)', [ownerEmail, inviteeEmail]);
    await db.execute('DELETE FROM map_user_roles WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['Test Map']);
    await db.execute('DELETE FROM maps WHERE name = ?', ['Test Map']);
    await db.execute('DELETE FROM users WHERE email IN (?, ?)', [ownerEmail, inviteeEmail]);
  });

  afterAll(async () => {
    // Cleanup test game
    await db.execute('DELETE FROM games WHERE id = ?', [testGame]);
  });

  async function createTestInvitation(status = 'pending') {
    const inv = await MapInvitationModel.createInvitation({
      mapId: testMap.id,
      inviterId: owner.id,
      inviteeEmail: invitee.email,
      role: 'viewer'
    });

    // Verify that the invitation has been created
    const [invitations] = await db.execute(
      'SELECT * FROM map_invitations WHERE token = ?',
      [inv.token]
    );
    expect(invitations.length).toBe(1);
    expect(invitations[0].map_id).toBe(testMap.id);
    expect(invitations[0].inviter_id).toBe(owner.id);
    expect(invitations[0].invitee_email).toBe(invitee.email);
    expect(invitations[0].role).toBe('viewer');
    expect(invitations[0].status).toBe('pending');

    // Verify that the map still exists
    const [maps] = await db.execute(
      'SELECT * FROM maps WHERE id = ?',
      [testMap.id]
    );
    expect(maps.length).toBe(1);
    expect(maps[0].name).toBe('Test Map');

    // Verify that the game still exists
    const [games] = await db.execute(
      'SELECT * FROM games WHERE id = ?',
      [testGame]
    );
    expect(games.length).toBe(1);
    expect(games[0].name).toBe(testGame);

    // Verify that the inviter still exists
    const [inviters] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [owner.id]
    );
    expect(inviters.length).toBe(1);
    expect(inviters[0].email).toBe(ownerEmail);

    if (status !== 'pending') {
      await MapInvitationModel.updateInvitationStatus(inv.token, status);
      // Verify that the status has been updated
      const [updatedInvitations] = await db.execute(
        'SELECT * FROM map_invitations WHERE token = ?',
        [inv.token]
      );
      expect(updatedInvitations[0].status).toBe(status);
    }

    return invitations[0];
  }

  describe('GET /invitations/:token', () => {
    test('Should return correct data for pending invitation', async () => {
      invitation = await createTestInvitation();
      const response = await request(app).get(`/api/backend/invitations/${invitation.token}`);

      expect(response.status).toBe(200);
      expect(response.body.invitation).toMatchObject({
        status: 'pending',
        canAccept: true
      });
      expect(response.body.hasAccount).toBeDefined();
    });

    test('Should return correct data for accepted invitation', async () => {
      invitation = await createTestInvitation('accepted');
      const response = await request(app).get(`/api/backend/invitations/${invitation.token}`);

      expect(response.status).toBe(200);
      expect(response.body.invitation).toMatchObject({
        status: 'accepted'
      });
      expect(response.body.invitation.canAccept).toBeUndefined();
    });

    test('Should return correct data for rejected invitation', async () => {
      invitation = await createTestInvitation('rejected');
      const response = await request(app).get(`/api/backend/invitations/${invitation.token}`);

      expect(response.status).toBe(200);
      expect(response.body.invitation).toMatchObject({
        status: 'rejected'
      });
      expect(response.body.invitation.canAccept).toBeUndefined();
    });

    test('Should return correct data for expired invitation', async () => {
      invitation = await createTestInvitation();
      // Force expiration
      await db.execute(
        'UPDATE map_invitations SET expires_at = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE token = ?',
        [invitation.token]
      );
      await MapInvitationModel.cleanupExpiredInvitations();

      const response = await request(app).get(`/api/backend/invitations/${invitation.token}`);

      expect(response.status).toBe(200);
      expect(response.body.invitation).toMatchObject({
        status: 'expired'
      });
      expect(response.body.invitation.canAccept).toBeUndefined();
    });

    test('Should return correct data for cancelled invitation', async () => {
      invitation = await createTestInvitation('cancelled');
      const response = await request(app).get(`/api/backend/invitations/${invitation.token}`);

      expect(response.status).toBe(200);
      expect(response.body.invitation).toMatchObject({
        status: 'cancelled'
      });
      expect(response.body.invitation.canAccept).toBeUndefined();
    });

    test('Should indicate when user needs to create account', async () => {
      invitation = await createTestInvitation();
      const newEmail = 'newuser@test.com';
      await db.execute(
        'UPDATE map_invitations SET invitee_email = ? WHERE token = ?',
        [newEmail, invitation.token]
      );

      const response = await request(app).get(`/api/backend/invitations/${invitation.token}`);

      expect(response.status).toBe(200);
      expect(response.body.hasAccount).toBe(false);
      expect(response.body.authStatus).toBe('needs_auth');
    });

    test('Should indicate when user needs to login', async () => {
      invitation = await createTestInvitation();
      const response = await request(app).get(`/api/backend/invitations/${invitation.token}`);

      expect(response.status).toBe(200);
      expect(response.body.hasAccount).toBe(true);
      expect(response.body.authStatus).toBe('needs_auth');
    });

    test('Should indicate when user is logged in with wrong account', async () => {
      invitation = await createTestInvitation();
      console.log('Created invitation:', invitation);
      const wrongUser = await createUser({
        email: 'wrong@test.com',
        passwordHash: 'hash',
        displayName: 'Wrong User'
      });
      console.log('Created wrong user:', wrongUser);
      const wrongToken = jwt.sign({ id: wrongUser.id, email: wrongUser.email }, process.env.JWT_SECRET);
      console.log('Generated wrong token:', wrongToken);

      const response = await request(app)
        .get(`/api/backend/invitations/${invitation.token}`)
        .set('Authorization', `Bearer ${wrongToken}`);

      console.log('Response:', response.body);

      expect(response.status).toBe(200);
      expect(response.body.authStatus).toBe('wrong_account');
      expect(response.body.currentUserEmail).toBe('wrong@test.com');
    });
  });

  describe('POST /invitations/:token/response', () => {
    test('Should not allow accepting expired invitation', async () => {
      invitation = await createTestInvitation();
      // Force expiration
      await db.execute(
        'UPDATE map_invitations SET expires_at = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE token = ?',
        [invitation.token]
      );
      await MapInvitationModel.cleanupExpiredInvitations();

      const response = await request(app)
        .post(`/api/backend/invitations/${invitation.token}/response`)
        .send({ action: 'accept' });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVITATION_INVALID');
    });

    test('Should not allow accepting cancelled invitation', async () => {
      invitation = await createTestInvitation('cancelled');
      const response = await request(app)
        .post(`/api/backend/invitations/${invitation.token}/response`)
        .send({ action: 'accept' });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVITATION_INVALID');
    });

    test('Should create new account with verified email when accepting', async () => {
      invitation = await createTestInvitation();
      const newEmail = 'newuser@test.com';
      await db.execute(
        'UPDATE map_invitations SET invitee_email = ? WHERE token = ?',
        [newEmail, invitation.token]
      );

      const response = await request(app)
        .post(`/api/backend/invitations/${invitation.token}/response`)
        .send({
          action: 'accept',
          registrationData: {
            displayName: 'New User',
            password: 'TestPassword123!'
          }
        });

      expect(response.status).toBe(200);

      // Verify that the account has been created with the verified email
      const [users] = await db.execute(
        'SELECT email_verified FROM users WHERE email = ?',
        [newEmail]
      );
      expect(users[0].email_verified).toBe(1);
    });

    test('Should assign correct role when accepting', async () => {
      invitation = await createTestInvitation();
      const inviteeToken = jwt.sign({ id: invitee.id, email: invitee.email }, process.env.JWT_SECRET);

      const response = await request(app)
        .post(`/api/backend/invitations/${invitation.token}/response`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .send({ action: 'accept' });

      expect(response.status).toBe(200);

      // Verify that the role has been assigned
      const [roles] = await db.execute(
        'SELECT role FROM map_user_roles WHERE map_id = ? AND user_id = ?',
        [testMap.id, invitee.id]
      );
      expect(roles[0].role).toBe('viewer');
    });

    test('Should handle rejection properly', async () => {
      invitation = await createTestInvitation();
      const inviteeToken = jwt.sign({ id: invitee.id, email: invitee.email }, process.env.JWT_SECRET);

      const response = await request(app)
        .post(`/api/backend/invitations/${invitation.token}/response`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .send({ action: 'reject' });

      expect(response.status).toBe(200);

      // Verify that the invitation has been marked as rejected
      const [invitations] = await db.execute(
        'SELECT status FROM map_invitations WHERE token = ?',
        [invitation.token]
      );
      expect(invitations[0].status).toBe('rejected');

      // Verify that no role has been assigned
      const [roles] = await db.execute(
        'SELECT role FROM map_user_roles WHERE map_id = ? AND user_id = ?',
        [testMap.id, invitee.id]
      );
      expect(roles.length).toBe(0);
    });

    test('Should not allow wrong user to accept', async () => {
      invitation = await createTestInvitation();
      const wrongUser = await createUser({
        email: 'wrong-test@test.com',
        passwordHash: 'hash',
        displayName: 'Wrong User',
        preferredLanguage: 'en'
      });
      const wrongToken = jwt.sign({ id: wrongUser.id, email: wrongUser.email }, process.env.JWT_SECRET);

      const response = await request(app)
        .post(`/api/backend/invitations/${invitation.token}/response`)
        .set('Authorization', `Bearer ${wrongToken}`)
        .send({ action: 'accept' });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('WRONG_USER');
    });

    test('Should prevent accepting invitation with different email than logged user', async () => {
      // Create invitation for invitee
      invitation = await createTestInvitation();

      // Create a different user
      const differentUser = await createUser({
        email: 'different@test.com',
        passwordHash: 'hash',
        displayName: 'Different User',
        preferredLanguage: 'en',
        authProvider: 'local'
      });
      await updateUserEmailVerified(differentUser.id);

      const differentToken = jwt.sign({ id: differentUser.id, email: differentUser.email }, process.env.JWT_SECRET);

      // Try to accept invitation with different user
      const response = await request(app)
        .post(`/api/backend/invitations/${invitation.token}/response`)
        .set('Authorization', `Bearer ${differentToken}`)
        .send({ action: 'accept' });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('WRONG_USER');

      // Cleanup
      await db.execute('DELETE FROM users WHERE email = ?', ['different@test.com']);
    });
  });

  describe('Cleanup Job', () => {
    test('Should automatically expire old invitations', async () => {
      invitation = await createTestInvitation();
      // Force expiration
      await db.execute(
        'UPDATE map_invitations SET expires_at = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE token = ?',
        [invitation.token]
      );

      await MapInvitationModel.cleanupExpiredInvitations();

      const [rows] = await db.execute(
        'SELECT status FROM map_invitations WHERE token = ?',
        [invitation.token]
      );

      expect(rows[0].status).toBe('expired');
    });

    test('Should not affect valid invitations', async () => {
      invitation = await createTestInvitation();
      await MapInvitationModel.cleanupExpiredInvitations();

      const [rows] = await db.execute(
        'SELECT status FROM map_invitations WHERE token = ?',
        [invitation.token]
      );

      expect(rows[0].status).toBe('pending');
    });
  });
});
