const request = require('supertest');
const app = require('../../app');
const db = require('../../src/utils/db');
const { createUser } = require('../../src/models/UserModel');
const bcrypt = require('bcrypt');

describe('🔐 POST /api/backend/login', () => {
  const testUser = {
    email: 'loginuser@example.com',
    password: 'Test1234!',
    displayName: 'LoginUser',
  };

  beforeAll(async () => {
    await db.execute(`DELETE FROM users WHERE email = ?`, [testUser.email]);

    const passwordHash = await bcrypt.hash(testUser.password, 10);

    await createUser({
      email: testUser.email.toLowerCase(),
      passwordHash,
      displayName: testUser.displayName,
    });
  });

  it('should reject missing email', async () => {
    const res = await request(app)
      .post('/api/backend/auth/login')
      .send({ password: testUser.password });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('should reject missing password', async () => {
    const res = await request(app)
      .post('/api/backend/auth/login')
      .send({ email: testUser.email });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  it('should reject invalid credentials (unknown email)', async () => {
    const res = await request(app)
      .post('/api/backend/auth/login')
      .send({ email: 'unknown@example.com', password: 'WrongPass123!' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/credentials/i);
  });

  it('should reject login if email is not verified', async () => {
    const res = await request(app)
      .post('/api/backend/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/verify your email/i);
  });

  it('should allow login after email verification', async () => {
    testUser.email = testUser.email.toLowerCase();

    await db.execute(
      `UPDATE users SET email_verified = true WHERE email = ?`,
      [testUser.email]
    );

    const res = await request(app)
      .post('/api/backend/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.displayName).toBe(testUser.displayName);
  });

  it('should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/backend/auth/login')
      .send({ email: testUser.email, password: 'WrongPassword123!' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/credentials/i);
  });
});
