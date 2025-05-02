const request = require('supertest');
const app = require('../../app');
const db = require('../../src/utils/db');
const { createUser } = require('../../src/models/UserModel');
const jwt = require('jsonwebtoken');

describe('📨 GET /api/backend/verify-email', () => {
  const testEmail = 'verifyuser@example.com';
  let token;
  let userId;

  beforeAll(async () => {
    await db.execute(`DELETE FROM users WHERE email = ?`, [testEmail]);

    const result = await createUser({
      email: testEmail,
      passwordHash: 'mockhash123',
      displayName: 'VerifyUser'
    });

    userId = result.id;

    token = jwt.sign({ email: testEmail }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
  });

  it('should verify email with valid token', async () => {
    const res = await request(app).get(`/api/backend/verify-email?token=${token}`);
    expect(res.statusCode).toBe(302); // redirection vers front
  });

  it('should return 400 with invalid token', async () => {
    const res = await request(app).get('/api/backend/verify-email?token=invalid.token.here');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('should return 404 for unknown user', async () => {
    const fakeToken = jwt.sign({ email: 'unknown@example.com' }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    const res = await request(app).get(`/api/backend/verify-email?token=${fakeToken}`);
    expect(res.statusCode).toBe(404);
  });

  it('should return 200 if email is already verified', async () => {
    // Vérifie l'email manuellement (direct en DB)
    await db.execute(
      `UPDATE users SET email_verified = true WHERE id = ?`,
      [userId]
    );

    const res = await request(app).get(`/api/backend/verify-email?token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/already verified/i);
  });
});
