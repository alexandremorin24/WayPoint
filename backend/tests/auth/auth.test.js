const request = require('supertest');
const app = require('../../app');
const db = require('../../src/utils/db')

describe('🔐 POST /api/register', () => {

  beforeAll(async () => {
    await db.execute(`DELETE FROM users WHERE email IN (?, ?, ?, ?)`, [
      'testuser@example.com',
      'testuser1@example.com',
      'testuser2@example.com',
      'duplicate@example.com',
    ]);

    await db.execute(`DELETE FROM users WHERE display_name IN (?, ?)`, [
      'TestUser123',
      'UniqueUser'
    ]);
  });

  it('should reject missing email', async () => {
    const res = await request(app).post('/api/register').send({
      password: 'Test1234!',
      confirmPassword: 'Test1234!',
      displayName: 'TestUser123'
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject invalid email format', async () => {
    const res = await request(app).post('/api/register').send({
      email: 'invalid-email',
      password: 'Test1234!',
      confirmPassword: 'Test1234!',
      displayName: 'TestUser123'
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject password mismatch', async () => {
    const res = await request(app).post('/api/register').send({
      email: 'testuser@example.com',
      password: 'Test1234!',
      confirmPassword: 'WrongPassword!',
      displayName: 'TestUser123'
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject weak password', async () => {
    const res = await request(app).post('/api/register').send({
      email: 'testuser@example.com',
      password: 'weakpass',
      confirmPassword: 'weakpass',
      displayName: 'TestUser123'
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject invalid display name format', async () => {
    const res = await request(app).post('/api/register').send({
      email: 'testuser@example.com',
      password: 'Test1234!',
      confirmPassword: 'Test1234!',
      displayName: 'Invalid_Name!'
    });
    expect(res.statusCode).toBe(400);
  });

  it('should register a new user with valid data', async () => {
    const res = await request(app).post('/api/register').send({
      email: 'testuser@example.com',
      password: 'Test1234!',
      confirmPassword: 'Test1234!',
      displayName: 'TestUser123'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe('testuser@example.com');
    expect(res.body.user.displayName).toBe('TestUser123');
  });

  it('should reject duplicate email', async () => {
    await request(app).post('/api/register').send({
      email: 'testuser@example.com',
      password: 'Test1234!',
      confirmPassword: 'Test1234!',
      displayName: 'TestUserDup1'
    });

    const res = await request(app).post('/api/register').send({
      email: 'testuser@example.com',
      password: 'Test1234!',
      confirmPassword: 'Test1234!',
      displayName: 'TestUserDup2'
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/Email already in use/);
  });

  it('should reject duplicate display name', async () => {
    await request(app).post('/api/register').send({
      email: 'testuser1@example.com',
      password: 'Test1234!',
      confirmPassword: 'Test1234!',
      displayName: 'UniqueUser'
    });

    const res = await request(app).post('/api/register').send({
      email: 'testuser2@example.com',
      password: 'Test1234!',
      confirmPassword: 'Test1234!',
      displayName: 'UniqueUser'
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/display name.*taken/i);
  });
});
