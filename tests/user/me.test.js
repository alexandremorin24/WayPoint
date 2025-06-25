const request = require('supertest');
const app = require('../../app');
const db = require('../../src/utils/db');
const { createUser } = require('../../src/models/UserModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('🔐 GET /api/backend/me', () => {
  const testUser = {
    id: null,
    email: 'meuser@example.com',
    password: 'Test1234!',
    displayName: 'MeUser',
  };

  let validToken = null;

  beforeAll(async () => {

    await db.execute(`DELETE FROM users WHERE email = ?`, [testUser.email]);

    // Create a test user
    const passwordHash = await bcrypt.hash(testUser.password, 10);
    const result = await createUser({
      email: testUser.email.toLowerCase(),
      passwordHash,
      displayName: testUser.displayName,
    });

    testUser.id = result.id;

    // Update the user to set email_verified to true
    await db.execute(
      `UPDATE users SET email_verified = true WHERE id = ?`,
      [testUser.id]
    );

    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [testUser.id]);

    // Create a valid JWT token
    validToken = jwt.sign(
      {
        id: testUser.id,
        email: testUser.email.toLowerCase()
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );
  });

  it('should reject without authorization header', async () => {
    const res = await request(app).get('/api/backend/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/authorization/i);
  });

  it('should reject with invalid token', async () => {
    const res = await request(app)
      .get('/api/backend/me')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('should return user info with valid token', async () => {
    const res = await request(app)
      .get('/api/backend/me')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(testUser.email.toLowerCase());
    expect(res.body.displayName).toBe(testUser.displayName);
  });
});
